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

  it("keeps the required helper scripts and handoff docs in the repo", () => {
    const handoff = readFileSync("docs/handoff/latest.md", "utf8");
    const readme = readFileSync("README.md", "utf8");

    expect(handoff).toContain("Source branch:");
    expect(handoff).toContain("Workflow status:");
    expect(readme).toContain("npm run release:preflight:preview");
    expect(readme).toContain("npm run release:preflight:production");
  });
});
