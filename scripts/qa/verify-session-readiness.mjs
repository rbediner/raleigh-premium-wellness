/**
 * Purpose: Enforce a strict startup/preflight gate so a new machine or Codex
 * session can resume safely from repo state alone.
 * Role: Fails fast when required docs, runtime alignment, git alignment, or
 * obvious sync issues would make a resume session unsafe.
 * Dependencies: Node.js, Git, and the local repo checkout.
 * Risk: Low. This script only reads repo state and exits non-zero on problems.
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const ignoredDirectories = new Set([".git", "node_modules", "dist", "test-results"]);

function readCommand(command) {
  return execSync(command, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
}

function tryReadCommand(command) {
  try {
    return readCommand(command);
  } catch {
    return "";
  }
}

export function parseHandoffMetadata(handoffContent) {
  const branchMatch = handoffContent.match(/Source branch:\s*`([^`]+)`/i);
  const commitMatch = handoffContent.match(/Source commit:\s*`([^`]+)`/i);
  const sequenceMatch = handoffContent.match(/Handoff sequence:\s*`?(\d+)`?/i);

  return {
    sourceBranch: branchMatch?.[1] ?? "",
    sourceCommit: commitMatch?.[1] ?? "",
    handoffSequence: sequenceMatch ? Number(sequenceMatch[1]) : null,
  };
}

export function normalizeNodeExpectation(nvmrcContent) {
  const trimmedVersion = nvmrcContent.trim().replace(/^v/i, "");
  const majorVersion = trimmedVersion.split(".")[0];
  return {
    raw: trimmedVersion,
    major: majorVersion,
  };
}

export function findObviousCloudSyncArtifacts(currentDirectory, findings = []) {
  for (const entry of readdirSync(currentDirectory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const absoluteEntryPath = path.join(currentDirectory, entry);
    const relativeEntryPath = path.relative(repoRoot, absoluteEntryPath) || entry;
    const entryStats = statSync(absoluteEntryPath);

    if (entryStats.isDirectory()) {
      findObviousCloudSyncArtifacts(absoluteEntryPath, findings);
      continue;
    }

    const lowerCaseEntryName = entry.toLowerCase();

    if (
      lowerCaseEntryName.endsWith(".icloud") ||
      lowerCaseEntryName.startsWith("._") ||
      lowerCaseEntryName.includes("conflicted copy")
    ) {
      findings.push(relativeEntryPath);
    }
  }

  return findings.sort();
}

export function buildReadinessReport({
  requiredFiles,
  expectedNodeMajor,
  currentNodeMajor,
  handoffBranch,
  currentBranch,
  currentHead,
  remoteHead,
  workingTreeState,
  cloudSyncArtifacts,
}) {
  const failures = [];

  for (const requiredFile of requiredFiles) {
    if (!existsSync(requiredFile)) {
      failures.push(`Missing required file: ${requiredFile}`);
    }
  }

  if (!handoffBranch) {
    failures.push("Handoff file is missing a source branch.");
  }

  if (!currentHead) {
    failures.push("Git HEAD could not be read.");
  }

  if (expectedNodeMajor !== currentNodeMajor) {
    failures.push(
      `Node version mismatch. Expected major ${expectedNodeMajor}, but found ${currentNodeMajor}.`,
    );
  }

  if (workingTreeState.trim()) {
    failures.push("Working tree is dirty. Commit, stash, or discard local changes before starting.");
  }

  if (handoffBranch && currentBranch !== handoffBranch) {
    failures.push(
      `Current branch ${currentBranch} does not match handoff branch ${handoffBranch}.`,
    );
  }

  if (!remoteHead) {
    failures.push(`Remote branch origin/${handoffBranch} is missing locally. Run git fetch origin.`);
  } else if (currentHead !== remoteHead) {
    failures.push(
      `Local HEAD ${currentHead} does not match origin/${handoffBranch} ${remoteHead}. Pull or reset safely before editing.`,
    );
  }

  if (cloudSyncArtifacts.length > 0) {
    failures.push(
      `Obvious cloud-sync duplicate artifacts are present: ${cloudSyncArtifacts.join(", ")}`,
    );
  }

  return failures;
}

export function main() {
  const requiredFiles = ["README.md", "docs/handoff/latest.md", ".nvmrc"];
  const handoffContent = existsSync("docs/handoff/latest.md")
    ? readFileSync("docs/handoff/latest.md", "utf8")
    : "";
  const handoffMetadata = parseHandoffMetadata(handoffContent);
  const expectedNodeVersion = normalizeNodeExpectation(readFileSync(".nvmrc", "utf8"));
  const currentNodeMajor = process.versions.node.split(".")[0];
  const currentBranch = tryReadCommand("git rev-parse --abbrev-ref HEAD");
  const currentHead = tryReadCommand("git rev-parse HEAD");
  const remoteHead = handoffMetadata.sourceBranch
    ? tryReadCommand(`git rev-parse origin/${handoffMetadata.sourceBranch}`)
    : "";
  const workingTreeState = tryReadCommand("git status --short");
  const cloudSyncArtifacts = findObviousCloudSyncArtifacts(repoRoot);

  const failures = buildReadinessReport({
    requiredFiles,
    expectedNodeMajor: expectedNodeVersion.major,
    currentNodeMajor,
    handoffBranch: handoffMetadata.sourceBranch,
    currentBranch,
    currentHead,
    remoteHead,
    workingTreeState,
    cloudSyncArtifacts,
  });

  if (failures.length > 0) {
    const message = failures.map((failure) => `- ${failure}`).join("\n");
    throw new Error(`Session readiness failed:\n${message}`);
  }

  console.log("Session readiness checks passed.");
  console.log(`Handoff sequence: ${handoffMetadata.handoffSequence ?? "unknown"}`);
  console.log(`Aligned branch: ${handoffMetadata.sourceBranch}`);
  console.log(`Aligned commit: ${currentHead}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
