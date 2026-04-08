/**
 * Purpose: Enforce that repo-local release documents exist and contain the
 * core SOP wording required for future operators and future Codex sessions.
 * Role: Acts as a docs gate in local runs and CI.
 * Dependencies: Node.js only.
 * Risk: Low. This script only reads files and exits non-zero on missing policy.
 */

import { readFileSync } from "node:fs";

const requiredDocumentRules = [
  {
    filePath: "README.md",
    requiredSnippets: [
      "`staging` is the preview branch",
      "`main` is the live production branch",
      "preview deploys come from `staging`",
      "production deploys come from `main`",
      "production is not considered complete until deploy verification passes",
      "Open `README.md`.",
      "Run `npm run session:ready`.",
      "npm run handoff:update",
      "Do not rely on cloud-synced `.gdoc` or `.gsheet` shortcut files as tracked repo state.",
      "ps -ax | rg \"serve-static-site|playwright|chromium\"",
      "The app terminal should be back at a normal shell prompt before you leave the session.",
    ],
  },
  {
    filePath: "docs/release/release-sop.md",
    requiredSnippets: [
      "make changes on a feature branch",
      "merge approved work into `staging`",
      "promote that exact approved commit to `main`",
      "never announce production complete until verification passes",
      "Every new machine or new Codex session must read `README.md` first.",
      "Run `npm run session:ready` before writing code.",
      "Refresh the canonical handoff with `npm run handoff:update`",
      "Before ending a work session, inspect for stray local preview or browser QA processes.",
      "Leave the app terminal back at a normal shell prompt before handing off the repo.",
    ],
  },
  {
    filePath: "docs/handoff/latest.md",
    requiredSnippets: [
      "Handoff sequence:",
      "Updated at (UTC):",
      "Source branch:",
      "Source commit:",
      "Current Branch Model",
      "Current CI Or Deploy Status Summary",
      "Operator Notes For Next Session",
    ],
  },
  {
    filePath: "planning/the-raleigh-tox-prd-reference.md",
    requiredSnippets: ["Google Doc URL:", "Purpose:"],
  },
  {
    filePath: "data-sources/the-tox-raleigh-outreach-sheet-reference.md",
    requiredSnippets: ["Google Sheet URL:", "Purpose:"],
  },
];

for (const rule of requiredDocumentRules) {
  const documentContent = readFileSync(rule.filePath, "utf8");
  const normalizedDocumentContent = documentContent.toLowerCase();

  for (const requiredSnippet of rule.requiredSnippets) {
    if (!normalizedDocumentContent.includes(requiredSnippet.toLowerCase())) {
      throw new Error(`${rule.filePath} is missing required SOP wording: ${requiredSnippet}`);
    }
  }
}

console.log("Release documentation gate passed.");
