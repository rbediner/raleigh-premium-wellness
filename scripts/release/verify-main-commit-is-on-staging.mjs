/**
 * Purpose: Enforce that a production candidate commit already exists on the
 * staging branch before main is allowed to represent it as the approved release.
 * Role: Protects the "exact approved commit" rule from the release SOP.
 * Dependencies: Git with origin/staging available locally.
 * Risk: Low. This script only reads branch history and exits non-zero on drift.
 */

import { execSync } from "node:child_process";

const commandLineArguments = process.argv.slice(2);
const shaIndex = commandLineArguments.indexOf("--sha");
const candidateSha =
  shaIndex >= 0 ? commandLineArguments[shaIndex + 1] : execSync("git rev-parse HEAD").toString().trim();

const remoteBranchesContainingCommit = execSync(`git branch -r --contains ${candidateSha}`)
  .toString()
  .trim();

if (!remoteBranchesContainingCommit.includes("origin/staging")) {
  throw new Error(
    `Production promotion blocked: ${candidateSha} is not contained in origin/staging.`,
  );
}

console.log(`Promotion check passed: ${candidateSha} is present on origin/staging.`);
