/**
 * Purpose: Keep the backend QA trigger SOP aligned with the repo's release
 * documents so future sessions do not drift back into running the expensive
 * live-staging backend pack by default.
 * Role: Policy test for release and QA documentation.
 * Dependencies: Vitest and checked-in docs only.
 * Risk: Low. This test reads files and asserts required policy language.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("backend QA trigger policy", () => {
  it("documents the three QA tiers and the escalation philosophy", () => {
    const sop = readFileSync("docs/qa/backend-qa-trigger-sop.md", "utf8");

    expect(sop).toContain("Cheap Routine QA");
    expect(sop).toContain("Targeted Smoke QA");
    expect(sop).toContain("Full Live-Staging Backend Validation Pack");
    expect(sop).toContain("Skipping the full pack on low-risk changes is cost control and signal discipline, not laziness.");
  });

  it("lists the required full-pack triggers and explicit non-triggers", () => {
    const sop = readFileSync("docs/qa/backend-qa-trigger-sop.md", "utf8");

    expect(sop).toContain("submission-flow code changed");
    expect(sop).toContain("Apps Script backend code changed");
    expect(sop).toContain("Google Sheets mapping, schema, header, or tab-routing logic changed");
    expect(sop).toContain("copy-only edits");
    expect(sop).toContain("styling or layout changes with no submission-flow impact");
    expect(sop).toContain("docs-only changes");
  });

  it("links the SOP from the repo-level operator docs", () => {
    const readme = readFileSync("README.md", "utf8");
    const releaseSop = readFileSync("docs/release/release-sop.md", "utf8");
    const handoff = readFileSync("docs/handoff/latest.md", "utf8");

    expect(readme).toContain("Backend QA trigger policy: `docs/qa/backend-qa-trigger-sop.md`");
    expect(releaseSop).toContain("For the operational trigger list and decision matrix, read `docs/qa/backend-qa-trigger-sop.md`.");
    expect(handoff).toContain("The durable QA trigger rule now lives in `docs/qa/backend-qa-trigger-sop.md`");
  });
});
