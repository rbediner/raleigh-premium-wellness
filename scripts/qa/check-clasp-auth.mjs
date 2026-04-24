/**
 * Purpose: Fast preflight check for clasp auth before Apps Script push/deploy.
 * Role: Prevents release interruptions caused by missing local clasp tokens.
 * Dependencies: Node.js 20+ and a local ~/.clasprc.json file.
 * Risk: Low. Read-only check that exits non-zero when auth is missing.
 */

import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const claspConfigPath = path.join(os.homedir(), ".clasprc.json");

function failWithGuidance(message) {
  console.error(`\n[qa:clasp-auth] ${message}\n`);
  console.error("Recovery steps:");
  console.error("1) cd integrations/google-sheets-submissions");
  console.error("2) npx @google/clasp login --no-localhost");
  console.error("3) Complete Google auth in browser.");
  console.error("4) Paste the FULL localhost callback URL into terminal when prompted.");
  console.error("   Example: http://localhost:8888/?iss=...&code=...&scope=...");
  console.error("5) Re-run: npm run qa:clasp-auth");
  process.exit(1);
}

let rawConfig = "";
try {
  rawConfig = await readFile(claspConfigPath, "utf8");
} catch (error) {
  failWithGuidance(`Missing ${claspConfigPath}.`);
}

let parsedConfig = {};
try {
  parsedConfig = JSON.parse(rawConfig);
} catch (error) {
  failWithGuidance(`${claspConfigPath} is not valid JSON.`);
}

const defaultToken = parsedConfig?.tokens?.default;
const hasUsableToken =
  Boolean(defaultToken?.refresh_token) &&
  Boolean(defaultToken?.access_token) &&
  Boolean(defaultToken?.client_id);

if (!hasUsableToken) {
  failWithGuidance("No usable clasp token found (tokens.default is empty or incomplete).");
}

console.log(`[qa:clasp-auth] OK - local clasp auth is present at ${claspConfigPath}.`);
