/**
 * Purpose: Rewrite the single canonical handoff file with the latest repo
 * state so another machine or Codex session can resume safely.
 * Role: Produces one deterministic handoff entry instead of an endless log.
 * Dependencies: Node.js and Git. GitHub CLI is optional for richer CI status.
 * Risk: Low. This script only reads repo state and overwrites latest.md.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function readCommand(command) {
  return execSync(command, {
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

export function extractHandoffSequence(handoffContent) {
  const match = handoffContent.match(/Handoff sequence:\s*`?(\d+)`?/i);
  return match ? Number(match[1]) : 0;
}

export function extractBulletSection(handoffContent, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionMatch = handoffContent.match(
    new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`),
  );

  if (!sectionMatch) {
    return [];
  }

  return sectionMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
}

export function buildHandoffDocument({
  sequence,
  updatedAtUtc,
  sourceBranch,
  sourceCommit,
  branchAlignmentNotes,
  previewUrl,
  ciStatusSummary,
  blockers,
  operatorNotes,
}) {
  const blockerLines = blockers.length > 0 ? blockers : ["- No blockers recorded at handoff update time."];
  const operatorNoteLines =
    operatorNotes.length > 0
      ? operatorNotes
      : ["- Read README.md first, then docs/handoff/latest.md, before making changes."];

  return `# Latest Handoff

Handoff sequence: \`${sequence}\`

Updated at (UTC): \`${updatedAtUtc}\`

Source branch: \`${sourceBranch}\`

Source commit: \`${sourceCommit}\`

## Current Branch Model

- \`staging\` is the preview and integration branch.
- \`main\` is the production branch.
- Feature branches should merge into \`staging\` before anything is promoted to \`main\`.

## Branch Alignment Or Divergence Notes

${branchAlignmentNotes.join("\n")}

## Preview Or Staging URL

- ${previewUrl || "Preview URL not available from current remote configuration."}

## Current CI Or Deploy Status Summary

${ciStatusSummary.join("\n")}

## Blockers Or Manual Follow-Ups

${blockerLines.join("\n")}

## Operator Notes For Next Session

${operatorNoteLines.join("\n")}
`;
}

function derivePreviewUrl() {
  const originUrl = tryReadCommand("git remote get-url origin");
  const githubMatch = originUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);

  if (!githubMatch) {
    return "";
  }

  const owner = githubMatch[1];
  const repo = githubMatch[2];
  return `https://${owner}.github.io/${repo}/staging/`;
}

function describeBranchAlignment(sourceBranch) {
  const currentBranch = tryReadCommand("git rev-parse --abbrev-ref HEAD") || "unknown";
  const workingTreeState = tryReadCommand("git status --short");
  const upstreamBranch = tryReadCommand("git rev-parse --abbrev-ref --symbolic-full-name @{u}");
  const remoteHead = sourceBranch ? tryReadCommand(`git rev-parse origin/${sourceBranch}`) : "";
  const currentHead = tryReadCommand("git rev-parse HEAD") || "unknown";
  const aheadBehindCounts =
    sourceBranch && remoteHead
      ? tryReadCommand(`git rev-list --left-right --count HEAD...origin/${sourceBranch}`)
      : "";

  const notes = [
    `- Current branch at update time: \`${currentBranch}\`.`,
    `- Current HEAD at update time: \`${currentHead}\`.`,
    `- Upstream tracking branch: ${upstreamBranch ? `\`${upstreamBranch}\`` : "not configured."}`,
    `- Working tree: ${workingTreeState ? "dirty." : "clean."}`,
  ];

  if (aheadBehindCounts) {
    const [aheadCount, behindCount] = aheadBehindCounts.split(/\s+/);
    notes.push(
      `- Compared with \`origin/${sourceBranch}\`: ahead ${aheadCount}, behind ${behindCount}.`,
    );
  } else if (sourceBranch) {
    notes.push(`- Compared with \`origin/${sourceBranch}\`: unavailable locally.`);
  }

  return {
    notes,
    currentBranch,
    currentHead,
    workingTreeState,
    remoteHead,
  };
}

function readGithubStatusLine(workflowName, branchName) {
  const ghBinary = tryReadCommand("command -v gh");

  if (!ghBinary) {
    return `- ${workflowName} on ${branchName}: GitHub CLI not installed on this machine, so remote status was not queried.`;
  }

  const encodedQuery = `'map(select(.workflowName == "${workflowName}" and .headBranch == "${branchName}")) | .[0]'`;
  const runJson = tryReadCommand(
    `gh run list --limit 20 --json workflowName,headBranch,status,conclusion,url --jq ${encodedQuery}`,
  );

  if (!runJson || runJson === "null") {
    return `- ${workflowName} on ${branchName}: no recent run found from this machine.`;
  }

  try {
    const parsedRun = JSON.parse(runJson);
    return `- ${workflowName} on ${branchName}: status ${parsedRun.status}, conclusion ${parsedRun.conclusion || "in progress"}, url ${parsedRun.url}`;
  } catch {
    return `- ${workflowName} on ${branchName}: unable to parse GitHub CLI response.`;
  }
}

export function main() {
  const handoffPath = "docs/handoff/latest.md";
  const previousHandoffContent = existsSync(handoffPath) ? readFileSync(handoffPath, "utf8") : "";
  const nextSequence = extractHandoffSequence(previousHandoffContent) + 1;
  const sourceBranch = tryReadCommand("git rev-parse --abbrev-ref HEAD") || "unknown";
  const sourceCommit = tryReadCommand("git rev-parse HEAD") || "unknown";
  const updatedAtUtc = new Date().toISOString();
  const previewUrl = derivePreviewUrl();
  const preservedOperatorNotes = extractBulletSection(
    previousHandoffContent,
    "Operator Notes For Next Session",
  );
  const preservedBlockers = extractBulletSection(
    previousHandoffContent,
    "Blockers Or Manual Follow-Ups",
  );
  const branchAlignment = describeBranchAlignment(sourceBranch);
  const blockers = [...preservedBlockers];

  if (branchAlignment.workingTreeState) {
    blockers.unshift("- Working tree is dirty. Commit, stash, or clean changes before another machine starts editing.");
  }

  if (branchAlignment.remoteHead && branchAlignment.currentHead !== branchAlignment.remoteHead) {
    blockers.unshift(
      `- Local HEAD does not match \`origin/${sourceBranch}\`. Sync the branch before another machine resumes work.`,
    );
  }

  if (!branchAlignment.remoteHead) {
    blockers.unshift(`- Remote branch \`origin/${sourceBranch}\` was not available during handoff refresh.`);
  }

  const ciStatusSummary = [
    readGithubStatusLine("Preview Deploy", "staging"),
    readGithubStatusLine("Production Deploy", "main"),
  ];

  const handoffDocument = buildHandoffDocument({
    sequence: nextSequence,
    updatedAtUtc,
    sourceBranch,
    sourceCommit,
    branchAlignmentNotes: branchAlignment.notes,
    previewUrl,
    ciStatusSummary,
    blockers: [...new Set(blockers)],
    operatorNotes: preservedOperatorNotes,
  });

  writeFileSync(handoffPath, handoffDocument);
  console.log(`Updated ${handoffPath} with handoff sequence ${nextSequence}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
