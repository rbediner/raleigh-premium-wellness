/**
 * Purpose: Verify a remote preview or production deployment with retries so a
 * release is not declared complete before the published URL is actually serving.
 * Role: Used in CI after publish and available locally for manual reruns.
 * Dependencies: Node.js.
 * Risk: Low. This script only reads remote URLs.
 */

import { spawn } from "node:child_process";

const commandLineArguments = process.argv.slice(2);

function readArgument(flagName) {
  const argumentIndex = commandLineArguments.indexOf(flagName);
  return argumentIndex >= 0 ? commandLineArguments[argumentIndex + 1] : undefined;
}

const verificationUrl = readArgument("--url");
const verificationMode = readArgument("--mode");
const expectedSha = readArgument("--sha");
const ciRunUrl = readArgument("--ci-run-url");
const deployUrl = readArgument("--deploy-url");

if (!verificationUrl || !["preview", "production"].includes(verificationMode)) {
  throw new Error("Pass --url <deployed-url> and --mode preview|production.");
}

const maxAttempts = 12;
const delayMs = 10000;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function runSmokeAttempt() {
  return new Promise((resolve, reject) => {
    const smokeProcess = spawn(
      "node",
      [
        "scripts/qa/run-site-smoke-check.mjs",
        "--url",
        verificationUrl,
        "--mode",
        verificationMode,
        "--sha",
        expectedSha || "",
        "--ci-run-url",
        ciRunUrl || "",
        "--deploy-url",
        deployUrl || verificationUrl,
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      },
    );

    smokeProcess.on("exit", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`Remote smoke attempt failed for ${verificationUrl}.`));
    });
  });
}

let lastError;

for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
  try {
    await runSmokeAttempt();
    console.log(`Remote deployment verification passed on attempt ${attemptNumber}.`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.log(`Remote deployment verification attempt ${attemptNumber} failed. Retrying...`);
    await wait(delayMs);
  }
}

throw lastError;
