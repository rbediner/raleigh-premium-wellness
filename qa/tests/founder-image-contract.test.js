import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("founder image contract", () => {
  it("references responsive founder image variants in the about section", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");

    expect(htmlDocument).toContain("rb-mb-social-photo-640.webp");
    expect(htmlDocument).toContain("rb-mb-social-photo-960.jpg");
    expect(htmlDocument).toContain('class="founder-photo-card__image"');
    expect(htmlDocument).toContain("Roman Bediner and Marianna together");
  });

  it("keeps generated founder image variants available in the repo", () => {
    const requiredFiles = [
      "assets/optimized-images/founders/rb-mb-social-photo-640.webp",
      "assets/optimized-images/founders/rb-mb-social-photo-960.webp",
      "assets/optimized-images/founders/rb-mb-social-photo-1280.webp",
      "assets/optimized-images/founders/rb-mb-social-photo-640.jpg",
      "assets/optimized-images/founders/rb-mb-social-photo-960.jpg",
      "assets/optimized-images/founders/rb-mb-social-photo-1280.jpg",
    ];

    for (const requiredFile of requiredFiles) {
      expect(existsSync(requiredFile)).toBe(true);
    }
  });
});
