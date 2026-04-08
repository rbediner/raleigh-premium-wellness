import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("handoff latest contract", () => {
  it("keeps docs/handoff as a single-entry directory", () => {
    const handoffFiles = readdirSync("docs/handoff").sort();

    expect(handoffFiles).toEqual(["latest.md"]);
  });

  it("keeps the canonical handoff metadata in latest.md", () => {
    const handoff = readFileSync("docs/handoff/latest.md", "utf8");

    expect(handoff).toContain("Handoff sequence:");
    expect(handoff).toContain("Updated at (UTC):");
    expect(handoff).toContain("Source branch:");
    expect(handoff).toContain("Source commit:");
    expect(handoff).toContain("## Current Branch Model");
    expect(handoff).toContain("## Branch Alignment Or Divergence Notes");
    expect(handoff).toContain("## Preview Or Staging URL");
    expect(handoff).toContain("## Current CI Or Deploy Status Summary");
    expect(handoff).toContain("## Blockers Or Manual Follow-Ups");
    expect(handoff).toContain("## Operator Notes For Next Session");
  });
});
