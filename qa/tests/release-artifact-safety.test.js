import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release artifact safety", () => {
  it("builds a preview artifact that is blocked from indexing", () => {
    execSync("node scripts/release/build-site-artifact.mjs --mode preview", {
      stdio: "ignore",
    });

    const previewHtml = readFileSync("dist/preview/index.html", "utf8");
    const previewRobots = readFileSync("dist/preview/robots.txt", "utf8");

    expect(previewHtml).toContain('data-release-channel="preview"');
    expect(previewHtml).toContain('name="robots" content="noindex, noarchive, nofollow"');
    expect(previewHtml).not.toContain('rel="canonical"');
    expect(previewRobots).toContain("Disallow: /");
  });

  it("builds a production artifact that is not blocked from indexing", () => {
    execSync("node scripts/release/build-site-artifact.mjs --mode production", {
      stdio: "ignore",
    });

    const productionHtml = readFileSync("dist/production/index.html", "utf8");
    const productionRobots = readFileSync("dist/production/robots.txt", "utf8");

    expect(productionHtml).toContain('data-release-channel="production"');
    expect(productionHtml).not.toContain('name="robots" content="noindex, noarchive, nofollow"');
    expect(productionRobots).toContain("Allow: /");
  });
});
