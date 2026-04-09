import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public site contract", () => {
  function readNormalizedHtmlDocument() {
    return readFileSync("site/index.html", "utf8").replace(/\s+/g, " ");
  }

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

    expect(htmlDocument).toContain("New Premium Wellness Experience Coming to Raleigh");
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
    expect(htmlDocument).not.toContain("Prototype");
    expect(htmlDocument).not.toContain("Staging");
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
    const htmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain("A NEW STANDARD IN");
    expect(htmlDocument).toContain("PREMIUM WELLNESS");
    expect(htmlDocument).toContain("IS COMING TO RALEIGH");
    expect(htmlDocument).toContain("We’re bringing a premium body-focused wellness experience to Raleigh, designed to feel restorative, elevated, and worth making part of your routine.");
    expect(htmlDocument).toContain("A new premium wellness experience is taking shape in Raleigh.");
    expect(htmlDocument).toContain("We’re grateful to be building it with and for this community, and we’d love to stay connected with the people who want to help shape it, support it, or be part of it early.");

    expect(htmlDocument).not.toContain("This page is a simple invitation");
    expect(htmlDocument).not.toContain("prototype note");
    expect(htmlDocument).not.toContain("debug");
  });

  it("uses the approved partner and stay-connected trust copy", () => {
    const htmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain("We’re looking to connect with a small number of thoughtful local partners who care about wellness, community, and elevated everyday experiences.");
    expect(htmlDocument).toContain("If there’s a natural fit, we’d love to explore collaborations through events, activations, community touchpoints, and referral-friendly partnerships that create awareness, bring people together, and make the launch feel local from day one.");
    expect(htmlDocument).toContain("Founding Member VIP is for people who want to be first in line when our founding-member offers become available.");
    expect(htmlDocument).toContain("You’ll receive early updates, priority notice when pre-sales open, and first access to discounted services reserved for founding members.");
  });

  it("keeps the compact mobile menu structure and preferred submit CTA copy", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");
    const formConfiguration = readFileSync("scripts/site/form-configuration.js", "utf8");

    expect(htmlDocument).toContain('class="site-navigation__menu-button"');
    expect(htmlDocument).toContain('class="site-navigation__scrim"');
    expect(formConfiguration).toContain('submitLabel: "Start the Conversation"');
    expect(formConfiguration).toContain('submitLabel: "Explore a Partnership"');
    expect(formConfiguration).toContain('submitLabel: "Join the VIP List"');
  });

  it("uses the approved metadata and share-surface values", () => {
    const htmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain("<title>New Premium Wellness Experience Coming to Raleigh</title>");
    expect(htmlDocument).toContain('name="description" content="A new premium body-focused wellness experience is taking shape in Raleigh. Work with us, partner with us, or stay connected from the beginning."');
    expect(htmlDocument).toContain('property="og:title" content="A New Premium Wellness Experience Is Coming to Raleigh"');
    expect(htmlDocument).toContain('property="og:description" content="We’re bringing something special to Raleigh and inviting the people who want to help shape it, partner with it, or stay connected from the very beginning."');
    expect(htmlDocument).toContain('property="twitter:title" content="A New Premium Wellness Experience Is Coming to Raleigh"');
    expect(htmlDocument).toContain('property="twitter:description" content="We’re bringing something special to Raleigh and inviting the people who want to help shape it, partner with it, or stay connected from the very beginning."');
    expect(htmlDocument).toContain("../assets/share-surfaces/favicon.svg");
    expect(htmlDocument).toContain("../assets/share-surfaces/open-graph-preview-1200x630.png");
  });
});
