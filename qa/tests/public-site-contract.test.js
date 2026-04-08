import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public site contract", () => {
  it("keeps the public-facing page neutral and deep-linkable", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");

    expect(htmlDocument).toContain('id="hero"');
    expect(htmlDocument).toContain('id="work-with-us"');
    expect(htmlDocument).toContain('id="partner-with-us"');
    expect(htmlDocument).toContain('id="stay-connected"');
    expect(htmlDocument).toContain('id="about"');
    expect(htmlDocument).toContain('id="contact"');
    expect(htmlDocument).toContain('id="manager-studio-development"');
    expect(htmlDocument).toContain('id="front-of-house-team-member"');
    expect(htmlDocument).toContain('id="licensed-esthetician-opportunity"');

    expect(htmlDocument).not.toContain("The Tox");
    expect(htmlDocument).not.toContain("franchise");
    expect(htmlDocument).not.toContain("national brand");
  });
});
