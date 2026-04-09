import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("session readiness contract", () => {
  it("defines the new startup commands in package scripts", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(packageJson.scripts["session:ready"]).toBe(
      "node scripts/qa/verify-session-readiness.mjs",
    );
    expect(packageJson.scripts["handoff:update"]).toBe(
      "node scripts/release/update-handoff-latest.mjs",
    );
  });

  it("documents the cross-machine startup flow for humans and Codex", () => {
    const readme = readFileSync("README.md", "utf8");
    const sop = readFileSync("docs/release/release-sop.md", "utf8");
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(readme).toContain("## Cross-Machine Continuity");
    expect(readme).toContain("## Reference File Safety");
    expect(readme).toContain("Do not delete Google-linked reference files or shortcut files");
    expect(readme).toContain("`*.gslides`");
    expect(readme).toContain("assets/review-screenshots/");
    expect(readme).toContain("Open `README.md`.");
    expect(readme).toContain("Open `docs/handoff/latest.md`.");
    expect(readme).toContain("Open `docs/release/release-sop.md`.");
    expect(readme).toContain("Run `npm run session:ready`.");
    expect(readme).toContain("npm run handoff:update");
    expect(readme).toContain("Do not rely on cloud-synced `.gdoc` or `.gsheet` shortcut files");
    expect(gitignore).toContain("*.gslides");
    expect(gitignore).toContain("/assets/review-screenshots/*.png");
    expect(gitignore).toContain("/assets/review-screenshots/*.json");

    expect(sop).toContain("Every new machine or new Codex session must read `README.md` first.");
    expect(sop).toContain("Run `npm run session:ready` before writing code.");
    expect(sop).toContain("Refresh the canonical handoff with `npm run handoff:update`");
  });

  it("keeps the readiness script strict about startup safety checks", () => {
    const readinessScript = readFileSync("scripts/qa/verify-session-readiness.mjs", "utf8");

    expect(readinessScript).toContain('README.md');
    expect(readinessScript).toContain('docs/handoff/latest.md');
    expect(readinessScript).toContain('.nvmrc');
    expect(readinessScript).toContain("Working tree is dirty");
    expect(readinessScript).toContain("does not match handoff branch");
    expect(readinessScript).toContain("does not match origin/");
    expect(readinessScript).toContain("cloud-sync duplicate artifacts");
  });
});
