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

    expect(htmlDocument).toContain("Raleigh Premium Wellness Prototype");
    expect(htmlDocument).not.toContain("The Tox");
    expect(htmlDocument).not.toContain("The Tox Technique");
    expect(htmlDocument).not.toContain("franchisor");
    expect(htmlDocument).not.toContain("franchise");
    expect(htmlDocument).not.toContain("national brand");
    expect(htmlDocument).not.toContain("This page exists");
    expect(htmlDocument).not.toContain("This is the main reason the page exists");
    expect(htmlDocument).not.toContain("We are not trying to");
    expect(htmlDocument).not.toContain("This prototype keeps the structure realistic");
    expect(htmlDocument).not.toContain("Integration hooks");
  });

  it("keeps the studio development manager narrative as the visible work-with-us centerpiece", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");

    expect(htmlDocument).toContain("Help launch Raleigh’s next premium wellness destination.");
    expect(htmlDocument).toContain("You may be a great fit if...");
    expect(htmlDocument).toContain("Why this is exciting");
    expect(htmlDocument).toContain("What you might find yourself doing");
    expect(htmlDocument).toContain("Interested? Know someone?");

    expect(htmlDocument).not.toContain("<h3>Front of House Team Member</h3>");
    expect(htmlDocument).not.toContain("<h3>Licensed Esthetician Opportunity</h3>");
  });

  it("keeps the hero and footer outward-facing rather than meta or defensive", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");

    expect(htmlDocument).toContain("A NEW STANDARD IN");
    expect(htmlDocument).toContain("PREMIUM WELLNESS");
    expect(htmlDocument).toContain("IS COMING TO RALEIGH");
    expect(htmlDocument).toContain("A quiet preview of what may be coming to Raleigh.");

    expect(htmlDocument).not.toContain("This page is a simple invitation");
    expect(htmlDocument).not.toContain("prototype note");
    expect(htmlDocument).not.toContain("debug");
  });

  it("keeps the compact mobile menu structure and preferred submit CTA copy", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");
    const formConfiguration = readFileSync("scripts/site/form-configuration.js", "utf8");

    expect(htmlDocument).toContain('class="site-navigation__menu-button"');
    expect(htmlDocument).toContain('class="site-navigation__scrim"');
    expect(formConfiguration).toContain('submitLabel: "Start the Conversation"');
    expect(formConfiguration).toContain('submitLabel: "Explore a Partnership"');
    expect(formConfiguration).toContain('submitLabel: "Join the List"');
  });
});
