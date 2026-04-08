/**
 * Purpose: Run the Playwright browser QA suite against a locally served
 * preview artifact in a controlled, repeatable way.
 * Role: Replaces fragile implicit web-server startup with an explicit build,
 * serve, test, and shutdown sequence.
 * Dependencies: Node.js, Playwright, and the local static server script.
 * Risk: Low. This script starts and stops local child processes only.
 */

import { spawn } from "node:child_process";

const browserQaPort = String(4300 + Math.floor(Math.random() * 200));

function runProcess(command, commandArguments, extraEnvironment = {}) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, commandArguments, {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        ...extraEnvironment,
      },
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

const serverProcess = spawn("node", ["scripts/qa/serve-static-site.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    SITE_OUTPUT_DIR: "dist/preview",
    PORT: browserQaPort,
  },
});

try {
  await runProcess("node", ["scripts/release/build-site-artifact.mjs", "--mode", "preview"]);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await runProcess(
    "npx",
    ["playwright", "test", "--config", "qa/config/playwright.config.ts"],
    { PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${browserQaPort}` },
  );
} finally {
  serverProcess.kill("SIGTERM");
}
