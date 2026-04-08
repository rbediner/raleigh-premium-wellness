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
    ],
  },
  {
    filePath: "docs/release/release-sop.md",
    requiredSnippets: [
      "make changes on a feature branch",
      "merge approved work into `staging`",
      "promote that exact approved commit to `main`",
      "never announce production complete until verification passes",
    ],
  },
  {
    filePath: "docs/handoff/latest.md",
    requiredSnippets: [
      "Source branch:",
      "Source commit:",
      "Workflow status:",
      "Operator notes:",
    ],
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
