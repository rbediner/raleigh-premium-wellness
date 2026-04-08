/**
 * Purpose: Confirm that the local machine and repo state are ready for a safe
 * work or release session.
 * Role: Gives a non-engineer operator a simple green/red preflight before
 * running release or QA commands.
 * Dependencies: Node.js and Git.
 * Risk: Low. This script only reads local state.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

function readCommand(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

const readinessChecks = [
  {
    label: "package.json exists",
    passed: existsSync("package.json"),
  },
  {
    label: "README.md exists",
    passed: existsSync("README.md"),
  },
  {
    label: "release SOP exists",
    passed: existsSync("docs/release/release-sop.md"),
  },
  {
    label: "handoff doc exists",
    passed: existsSync("docs/handoff/latest.md"),
  },
];

const currentBranch = readCommand("git rev-parse --abbrev-ref HEAD");
const workingTreeState = readCommand("git status --short");

for (const check of readinessChecks) {
  if (!check.passed) {
    throw new Error(`Session readiness failed: ${check.label}`);
  }
}

console.log(`Current branch: ${currentBranch}`);
console.log(
  workingTreeState
    ? "Working tree has local changes. This is okay during development, but review them before release."
    : "Working tree is clean.",
);
console.log("Session readiness checks passed.");
