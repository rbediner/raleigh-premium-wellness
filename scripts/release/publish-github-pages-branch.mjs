/**
 * Purpose: Publish either the preview artifact or the production artifact to
 * the gh-pages branch.
 * Role: Keeps preview in /staging and production at the branch root so the two
 * environments can coexist safely.
 * Dependencies: Git, Node.js, and a writable GITHUB_TOKEN in CI.
 * Risk: This script writes to the publish branch, so branch targeting rules are
 * protected by CI policy tests and workflow restrictions.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const commandLineArguments = process.argv.slice(2);
const modeIndex = commandLineArguments.indexOf("--mode");
const publishMode = modeIndex >= 0 ? commandLineArguments[modeIndex + 1] : undefined;

if (!["preview", "production"].includes(publishMode)) {
  throw new Error("Pass --mode preview or --mode production.");
}

const githubRepository = process.env.GITHUB_REPOSITORY;
const githubToken = process.env.GITHUB_TOKEN;
const currentCommitSha = process.env.GITHUB_SHA || "local-development";

if (!githubRepository || !githubToken) {
  throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required to publish the gh-pages branch.");
}

const artifactDirectory = resolve(process.cwd(), "dist", publishMode);
if (!existsSync(artifactDirectory)) {
  throw new Error(`Artifact directory does not exist: ${artifactDirectory}`);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "tox-pages-"));
const publishDirectory = join(temporaryDirectory, "publish");
const authenticatedRemoteUrl = `https://x-access-token:${githubToken}@github.com/${githubRepository}.git`;

function runGitCommand(argumentsList, workingDirectory = publishDirectory) {
  execFileSync("git", argumentsList, {
    cwd: workingDirectory,
    stdio: "inherit",
  });
}

function ensurePublishBranchCheckout() {
  try {
    runGitCommand(["clone", "--depth", "1", "--branch", "gh-pages", authenticatedRemoteUrl, publishDirectory], temporaryDirectory);
  } catch {
    mkdirSync(publishDirectory, { recursive: true });
    runGitCommand(["init"], publishDirectory);
    runGitCommand(["checkout", "-b", "gh-pages"], publishDirectory);
    runGitCommand(["remote", "add", "origin", authenticatedRemoteUrl], publishDirectory);
  }
}

function removeDirectoryContents(targetDirectory, preserveNames = []) {
  for (const entryName of readdirSync(targetDirectory)) {
    if (preserveNames.includes(entryName)) {
      continue;
    }

    rmSync(join(targetDirectory, entryName), { recursive: true, force: true });
  }
}

function copyArtifactContents(sourceDirectory, targetDirectory) {
  mkdirSync(targetDirectory, { recursive: true });

  for (const entryName of readdirSync(sourceDirectory)) {
    cpSync(join(sourceDirectory, entryName), join(targetDirectory, entryName), {
      recursive: true,
    });
  }
}

ensurePublishBranchCheckout();

if (publishMode === "preview") {
  rmSync(join(publishDirectory, "staging"), { recursive: true, force: true });
  copyArtifactContents(artifactDirectory, join(publishDirectory, "staging"));
} else {
  removeDirectoryContents(publishDirectory, [".git", "staging"]);
  copyArtifactContents(artifactDirectory, publishDirectory);
}

writeFileSync(join(publishDirectory, ".nojekyll"), "");

runGitCommand(["add", "--all"]);

try {
  runGitCommand([
    "-c",
    "user.name=github-actions[bot]",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit",
    "-m",
    `Publish ${publishMode} artifact for ${currentCommitSha}`,
  ]);
} catch {
  console.log("No gh-pages changes to commit.");
}

runGitCommand(["push", "origin", "gh-pages"]);
