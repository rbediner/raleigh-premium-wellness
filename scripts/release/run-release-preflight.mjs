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

const baseCommands = [
  ["npm", ["run", "qa:session-readiness"]],
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
