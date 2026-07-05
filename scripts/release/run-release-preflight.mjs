/**
 * Purpose: Run the smallest responsible release gate for either preview or
 * production before a branch is promoted or published.
 * Role: Gives the operator one command that runs the required checks in order.
 * Dependencies: Node.js, npm, and the repo test/build scripts.
 * Risk: Low. This script only orchestrates existing commands.
 */

import { spawn } from "node:child_process";

const commandLineArguments = process.argv.slice(2);
const modeIndex = commandLineArguments.indexOf("--mode");
const releaseMode = modeIndex >= 0 ? commandLineArguments[modeIndex + 1] : undefined;

if (!["preview", "production"].includes(releaseMode)) {
  throw new Error("Pass --mode preview or --mode production.");
}

// qa:session-readiness checks for LOCAL machine drift (current branch matches
// the handoff doc's declared branch, local HEAD matches origin, no stray
// cloud-sync files). That's meaningful for a human/agent starting a session
// on a laptop, but structurally inapplicable to a fresh CI runner, which
// always has a clean checkout of exactly the triggering commit. It is also
// unsatisfiable by design for a production promotion: the earlier
// release:verify:promotion step requires main's commit to be byte-identical
// to a commit that exists on staging, and that commit's handoff doc will
// therefore always declare "staging" even once fast-forwarded onto main --
// so this check can never pass in the Production Deploy workflow. Skip it in
// CI; commit provenance is already covered by release:verify:promotion.
const baseCommands = [
  ...(process.env.CI ? [] : [["npm", ["run", "qa:session-readiness"]]]),
  ["npm", ["run", "qa:docs-gate"]],
  ["npm", ["run", "test:workflow"]],
  ["npm", ["run", "test:unit"]],
  ["npm", ["run", "test:qa"]],
];

const modeSpecificCommands =
  releaseMode === "preview"
    ? [["npm", ["run", "qa:preview-smoke:local"]]]
    : [
        ["npm", ["run", "release:build:production"]],
        ["npm", ["run", "qa:production-smoke:local"]],
      ];

function runCommand(command, commandArguments) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, commandArguments, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
    });

    childProcess.on("exit", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArguments.join(" ")} failed.`));
    });
  });
}

for (const [command, commandArguments] of [...baseCommands, ...modeSpecificCommands]) {
  await runCommand(command, commandArguments);
}

console.log(`Release preflight passed for ${releaseMode}.`);
