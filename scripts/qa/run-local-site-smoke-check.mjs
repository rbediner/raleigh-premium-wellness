/**
 * Purpose: Run a local smoke check against a freshly built artifact without
 * requiring the operator to manage a second terminal window.
 * Role: Provides copy-pasteable preview and production smoke commands.
 * Dependencies: Node.js and the local static server script.
 * Risk: Low. This script starts and stops a local child process only.
 */

import { spawn } from "node:child_process";

const commandLineArguments = process.argv.slice(2);
const modeIndex = commandLineArguments.indexOf("--mode");
const smokeMode = modeIndex >= 0 ? commandLineArguments[modeIndex + 1] : undefined;

if (!["preview", "production"].includes(smokeMode)) {
  throw new Error("Pass --mode preview or --mode production.");
}

const buildProcess = spawn("node", ["scripts/release/build-site-artifact.mjs", "--mode", smokeMode], {
  cwd: process.cwd(),
  stdio: "inherit",
});

await new Promise((resolve, reject) => {
  buildProcess.on("exit", (exitCode) => {
    if (exitCode === 0) {
      resolve();
      return;
    }

    reject(new Error(`Build failed for ${smokeMode}.`));
  });
});

const serverProcess = spawn("node", ["scripts/qa/serve-static-site.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    SITE_OUTPUT_DIR: `dist/${smokeMode}`,
    PORT: "4173",
  },
});

async function stopServer() {
  serverProcess.kill("SIGTERM");
}

try {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const smokeProcess = spawn(
    "node",
    ["scripts/qa/run-site-smoke-check.mjs", "--url", "http://127.0.0.1:4173/", "--mode", smokeMode],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  await new Promise((resolve, reject) => {
    smokeProcess.on("exit", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(new Error(`Local smoke check failed for ${smokeMode}.`));
    });
  });
} finally {
  await stopServer();
}
