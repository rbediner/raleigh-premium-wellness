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
    const normalizedHtmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain('nav id="manager-studio-development" class="role-subnav"');
    expect(htmlDocument).toContain("Help launch Raleigh’s next premium wellness destination.");
    expect(htmlDocument).toContain("Who This Could Be For");
    expect(htmlDocument).toContain("You may be a strong fit if you are well connected in your community");
    expect(htmlDocument).toContain("Why This Is Exciting");
    expect(htmlDocument).toContain("What You Might Find Yourself Doing");
    expect(normalizedHtmlDocument).toContain("Hosting launch events, open houses, networking nights, pop-ups, and wellness gatherings that introduce the studio to the market");
    expect(normalizedHtmlDocument).toContain("Building smart relationships with gyms, fitness studios, apartment communities, members’ clubs, and other local partners");
    expect(normalizedHtmlDocument).toContain("Coordinating the moving pieces that help the studio open strong, including setup, vendor coordination, inventory readiness, training support, and pre-opening organization");
    expect(htmlDocument).toContain("Interested? Know someone?");

    expect(htmlDocument).not.toContain("<h3>Front of House Team Member</h3>");
    expect(htmlDocument).not.toContain("<h3>Licensed Esthetician Opportunity</h3>");
  });

  it("keeps visible bullet starters capitalized while preserving the editorial groups", () => {
    const htmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain("Community Presence");
    expect(htmlDocument).toContain("Creating community moments people remember, including local give-back events");
    expect(htmlDocument).toContain("Hosting launch events, open houses, networking nights, pop-ups, and wellness gatherings that introduce the studio to the market");
    expect(htmlDocument).toContain("Helping create educational and experiential moments that make the brand approachable");
    expect(htmlDocument).toContain("Building smart relationships with gyms, fitness studios, apartment communities");
    expect(htmlDocument).toContain("Turning local visibility into momentum through follow-up, introductions");
    expect(htmlDocument).toContain("Helping shape signature local experiences that make the brand feel social, shareable, and exciting");
    expect(htmlDocument).toContain("Working closely with ownership on launch planning, community presence, early growth, and overall market momentum");
    expect(htmlDocument).toContain("Helping recruit, energize, and support the team across technicians and front-of-house roles");
    expect(htmlDocument).toContain("Coordinating the moving pieces that help the studio open strong");
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

  it("keeps the hero and founder-image structure needed for the final polish pass", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");
    const stylesheet = readFileSync("styles/site.css", "utf8");

    expect(htmlDocument).toContain('class="hero-section hero-shell"');
    expect(htmlDocument).toContain('class="hero-section__actions"');
    expect(htmlDocument).toContain('class="founder-photo-card"');
    expect(htmlDocument).toContain('class="founder-photo-card__image"');
    expect(stylesheet).toContain(".hero-section__actions .button-link:last-child");
    expect(stylesheet).toContain(".founder-photo-card");
    expect(stylesheet).toContain(".founder-photo-card__image");
  });

  it("uses the approved partner and stay-connected trust copy", () => {
    const htmlDocument = readNormalizedHtmlDocument();

    expect(htmlDocument).toContain("We’re looking to connect with a small number of thoughtful local partners who care about wellness, community, and elevated everyday experiences.");
    expect(htmlDocument).toContain("If there’s a natural fit, we’d love to explore collaborations through events, activations, community touchpoints, and referral-friendly partnerships that create awareness, bring people together, and make the launch feel local from day one.");
    expect(htmlDocument).toContain("Founding Member VIP is for people who want to be first in line when our founding-member offers become available.");
    expect(htmlDocument).toContain("You’ll receive early updates, priority notice when pre-sales open, and first access to discounted services reserved for founding members.");
  });

  it("keeps label-style bullets and chips in title case", () => {
    const htmlDocument = readNormalizedHtmlDocument();
    const formConfiguration = readFileSync("scripts/site/form-configuration.js", "utf8");

    expect(htmlDocument).toContain("Community Presence");
    expect(htmlDocument).toContain("Partnership and Growth");
    expect(htmlDocument).toContain("Launch Leadership");
    expect(formConfiguration).toContain('label: "Partnership Idea"');
    expect(formConfiguration).toContain('label: "Audience / Community"');
    expect(formConfiguration).toContain('label: "Activation Concept"');
    expect(formConfiguration).toContain('label: "Venue / Business Fit"');
    expect(formConfiguration).toContain('label: "How I Know Them"');
    expect(formConfiguration).toContain('label: "Why They Stand Out"');
    expect(formConfiguration).toContain('label: "Community Credibility"');
    expect(formConfiguration).toContain('"Community Partnership"');
    expect(formConfiguration).toContain('"Launch Updates"');
    expect(formConfiguration).toContain('"General Early Access"');
  });

  it("keeps the compact mobile menu structure and preferred submit CTA copy", () => {
    const htmlDocument = readFileSync("site/index.html", "utf8");
    const formConfiguration = readFileSync("scripts/site/form-configuration.js", "utf8");

    expect(htmlDocument).toContain('class="site-navigation__menu-button"');
    expect(htmlDocument).toContain('class="site-navigation__scrim"');
    expect(htmlDocument).toContain('class="site-footer__closing-line"');
    expect(htmlDocument).toContain('data-nav-link="contact">Stay Connected</a>');
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
