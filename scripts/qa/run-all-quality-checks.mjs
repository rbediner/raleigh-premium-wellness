import { spawn } from "node:child_process";

const commandsToRun = [
  ["npm", ["run", "qa:docs-gate"]],
  ["npm", ["run", "test:workflow"]],
  ["npm", ["run", "test:unit"]],
  ["npm", ["run", "test:qa"]],
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

      reject(new Error(`${command} ${commandArguments.join(" ")} failed with exit code ${exitCode}.`));
    });
  });
}

for (const [command, commandArguments] of commandsToRun) {
  // The checks run in order so a failed unit test stops the browser suite.
  await runCommand(command, commandArguments);
}
