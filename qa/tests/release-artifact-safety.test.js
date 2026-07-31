import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readPngDimensions(filePath) {
  const imageBuffer = readFileSync(filePath);

  return {
    width: imageBuffer.readUInt32BE(16),
    height: imageBuffer.readUInt32BE(20),
  };
}

describe("release artifact safety", () => {
  it("builds a preview artifact that is blocked from indexing", () => {
    execSync("node scripts/release/build-site-artifact.mjs --mode preview", {
      stdio: "ignore",
    });

    const previewHtml = readFileSync("dist/preview/index.html", "utf8");
    const previewRobots = readFileSync("dist/preview/robots.txt", "utf8");

    expect(previewHtml).toContain('data-release-channel="preview"');
    expect(previewHtml).toContain('name="robots" content="noindex, noarchive, nofollow"');
    expect(previewHtml).toContain('property="og:url" content="https://rbediner.github.io/raleigh-premium-wellness/staging/"');
    expect(previewHtml).toContain('property="og:image" content="https://rbediner.github.io/raleigh-premium-wellness/staging/assets/share-surfaces/open-graph-preview-1200x630.png"');
    expect(previewHtml.match(/property="og:image"/g)?.length).toBe(1);
    expect(previewHtml.match(/property="twitter:image"/g)?.length).toBe(1);
    expect(previewHtml).not.toContain('rel="canonical"');
    expect(previewHtml).toMatch(/href="\.\/styles\/site\.css\?v=[a-f0-9]{40}"/);
    expect(previewHtml).toMatch(/src="\.\/scripts\/site-interactions\.js\?v=[a-f0-9]{40}"/);
    expect(previewRobots).toContain("Disallow: /");
    expect(existsSync("dist/preview/assets/optimized-images/founders/rb-mb-social-photo-960.jpg")).toBe(true);
    expect(existsSync("dist/preview/assets/share-surfaces/favicon.svg")).toBe(true);
    expect(existsSync("dist/preview/assets/share-surfaces/favicon.ico")).toBe(true);
    expect(existsSync("dist/preview/assets/share-surfaces/open-graph-preview-1200x630.png")).toBe(true);
    expect(existsSync("dist/preview/scripts/qr-attribution.js")).toBe(true);
  });

  it("builds a production artifact that is not blocked from indexing", () => {
    execSync("node scripts/release/build-site-artifact.mjs --mode production", {
      stdio: "ignore",
    });

    const productionHtml = readFileSync("dist/production/index.html", "utf8");
    const productionRobots = readFileSync("dist/production/robots.txt", "utf8");

    expect(productionHtml).toContain('data-release-channel="production"');
    expect(productionHtml).not.toContain('name="robots" content="noindex, noarchive, nofollow"');
    expect(productionHtml).toContain('rel="canonical" href="https://raleigh-premium-wellness.romanbediner.com/"');
    expect(productionHtml).toContain('property="og:url" content="https://raleigh-premium-wellness.romanbediner.com/"');
    expect(productionHtml).toContain('property="og:image" content="https://raleigh-premium-wellness.romanbediner.com/assets/share-surfaces/open-graph-preview-1200x630.png"');
    expect(productionHtml.match(/property="og:image"/g)?.length).toBe(1);
    expect(productionHtml.match(/property="twitter:image"/g)?.length).toBe(1);
    expect(productionRobots).toContain("Allow: /");
    expect(productionHtml).toMatch(/href="\.\/styles\/site\.css\?v=[a-f0-9]{40}"/);
    expect(productionHtml).toMatch(/src="\.\/scripts\/site-interactions\.js\?v=[a-f0-9]{40}"/);
    expect(existsSync("dist/production/assets/optimized-images/founders/rb-mb-social-photo-960.jpg")).toBe(true);
    expect(existsSync("dist/production/assets/share-surfaces/favicon.svg")).toBe(true);
    expect(existsSync("dist/production/assets/share-surfaces/favicon.ico")).toBe(true);
    expect(existsSync("dist/production/assets/share-surfaces/open-graph-preview-1200x630.png")).toBe(true);
    expect(existsSync("dist/production/scripts/qr-attribution.js")).toBe(true);
  });

  it("keeps the Open Graph image at the expected share-preview dimensions", () => {
    const ogImageDimensions = readPngDimensions("assets/share-surfaces/open-graph-preview-1200x630.png");

    expect(ogImageDimensions).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
