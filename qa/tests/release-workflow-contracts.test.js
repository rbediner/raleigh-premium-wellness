import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release workflow contracts", () => {
  it("documents staging as preview and main as production", () => {
    const readme = readFileSync("README.md", "utf8");
    const sop = readFileSync("docs/release/release-sop.md", "utf8");

    expect(readme).toContain("`staging` is the preview branch");
    expect(readme).toContain("`main` is the live production branch");
    expect(sop).toContain("Preview deploys must come from `staging`.");
    expect(sop).toContain("Production deploys must come from `main`.");
  });

  it("defines separate preview and production workflows with the correct branch triggers", () => {
    const previewWorkflow = readFileSync(".github/workflows/preview-deploy.yml", "utf8");
    const productionWorkflow = readFileSync(".github/workflows/production-deploy.yml", "utf8");

    expect(previewWorkflow).toContain("branches:");
    expect(previewWorkflow).toContain("- staging");
    expect(previewWorkflow).toContain("--mode preview");

    expect(productionWorkflow).toContain("branches:");
    expect(productionWorkflow).toContain("- main");
    expect(productionWorkflow).toContain("--mode production");
    expect(productionWorkflow).toContain("release:verify:promotion");
  });

  it("keeps GitHub-hosted workflow actions on current majors and documents the Pages runtime plan", () => {
    const previewWorkflow = readFileSync(".github/workflows/preview-deploy.yml", "utf8");
    const productionWorkflow = readFileSync(".github/workflows/production-deploy.yml", "utf8");
    const readme = readFileSync("README.md", "utf8");
    const sop = readFileSync("docs/release/release-sop.md", "utf8");

    expect(previewWorkflow).toContain("actions/checkout@v6");
    expect(previewWorkflow).toContain("actions/setup-node@v6");
    expect(productionWorkflow).toContain("actions/checkout@v6");
    expect(productionWorkflow).toContain("actions/setup-node@v6");

    expect(previewWorkflow).not.toContain("upload-pages-artifact");
    expect(productionWorkflow).not.toContain("upload-pages-artifact");
    expect(previewWorkflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
    expect(productionWorkflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");

    expect(readme).toContain("This repo does **not** use `actions/upload-pages-artifact`");
    expect(readme).toContain("`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` was **not** added");
    expect(readme).toContain("upgrade to `actions/upload-pages-artifact@v5`");
    expect(sop).toContain("This repo does not use `actions/upload-pages-artifact`.");
    expect(sop).toContain("`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'`");
  });

  it("keeps the required helper scripts and handoff docs in the repo", () => {
    const handoff = readFileSync("docs/handoff/latest.md", "utf8");
    const readme = readFileSync("README.md", "utf8");
    const sop = readFileSync("docs/release/release-sop.md", "utf8");

    expect(handoff).toContain("Source branch:");
    expect(handoff).toContain("Current CI Or Deploy Status Summary");
    expect(readme).toContain("npm run release:preflight:preview");
    expect(readme).toContain("npm run release:preflight:production");
    expect(readme).toContain("npm run session:ready");
    expect(readme).toContain("npm run handoff:update");
    expect(readme).toContain('ps -ax | rg "serve-static-site|playwright|chromium"');
    expect(sop).toContain("Before ending a work session, inspect for stray local preview or browser QA processes.");
    expect(sop).toContain("Leave the app terminal back at a normal shell prompt before handing off the repo.");
  });
});
