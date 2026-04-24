import { expect, test } from "@playwright/test";

test("homepage exposes anchored sections and adaptive form states", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "A NEW STANDARD IN PREMIUM WELLNESS IS COMING TO RALEIGH",
    }),
  ).toBeVisible();
  const primaryNavigation = page.getByLabel("Primary");
  await expect(
    primaryNavigation.getByRole("link", { name: "Work With Us", exact: true }),
  ).toHaveAttribute("href", "#work-with-us");
  await expect(
    primaryNavigation.getByRole("link", { name: "Find Out What’s Coming", exact: true }),
  ).toHaveAttribute("href", "#contact");
  await expect(
    page.getByRole("heading", { name: "Help launch Raleigh’s next premium wellness destination." }),
  ).toBeVisible();

  await page.getByLabel("I want to partner with you").check();
  await expect(page.getByLabel("Business / Organization Name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore a Partnership" })).toBeVisible();

  await page.getByLabel("I’m curious what’s coming to Raleigh").check();
  await expect(
    page.getByLabel("I’m curious what’s coming to Raleigh"),
  ).toBeChecked();
  await expect(
    page.getByLabel(
      "Yes, I’d be glad to hear from you by email and phone as plans take shape.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Find Out What’s Coming" })).toBeVisible();
  await expect(
    page.getByText(
      "We’re not sharing everything publicly just yet, but we are inviting thoughtful local interest from people who want to know what’s taking shape.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "We’re looking to connect with a small number of thoughtful local partners who care about wellness, community, and elevated everyday experiences.",
    ),
  ).toBeVisible();
});

test("cta routing preselects the matching form path", async ({ page }) => {
  await page.goto("/");

  await page.locator(".hero-section__actions").getByRole("link", { name: "Work With Us", exact: true }).click();
  await expect(page).toHaveURL(/interestPath=work_with_us/);
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByLabel("I want to work with you")).toBeChecked();
  await expect(page.getByRole("button", { name: "Start the Conversation" })).toBeVisible();

  await page.goto("/");
  await page.locator(".hero-section__actions").getByRole("link", { name: "Partner With Us", exact: true }).click();
  await expect(page).toHaveURL(/interestPath=partner_with_us/);
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByLabel("I want to partner with you")).toBeChecked();
  await expect(page.getByRole("button", { name: "Explore a Partnership" })).toBeVisible();

  await page.goto("/");
  await page.locator(".hero-section__actions").getByRole("link", { name: "Find Out What’s Coming", exact: true }).click();
  await expect(page).toHaveURL(/interestPath=find_out_whats_coming/);
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByLabel("I’m curious what’s coming to Raleigh")).toBeChecked();
  await expect(page.getByRole("button", { name: "Find Out What’s Coming" })).toBeVisible();
});

test("partner path keeps partnership-specific helper chips only", async ({ page }) => {
  await page.goto("/?interestPath=partner_with_us#contact");

  await expect(page.getByLabel("I want to partner with you")).toBeChecked();
  await expect(page.getByText("Partnership Idea", { exact: true })).toBeVisible();
  await expect(page.getByText("Audience / Community", { exact: true })).toBeVisible();
  await expect(page.getByText("Why I’m interested", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Referral opportunity", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /Partnership Idea/ })).toBeVisible();
  await expect(
    page.getByText(
      "Tell us a bit about your business, your audience, or the kind of collaboration you have in mind.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Additional Details")).toHaveCount(0);
  await expect(page.getByLabel("Website URL")).toHaveCount(0);
  await expect(page.getByLabel("Social Media Link")).toHaveCount(0);
  await expect(page.getByLabel("Yes, you may text me about this inquiry.")).toHaveCount(0);
});

test("work path stays light for first-touch outreach", async ({ page }) => {
  await page.goto("/?interestPath=work_with_us#contact");

  await expect(page.getByText("If someone came to mind while reading this, feel free to share this page with them.")).toBeVisible();
  await expect(page.getByLabel("Role of Interest")).toHaveCount(0);
  await expect(page.getByLabel("Are you reaching out for yourself or referring someone?")).toHaveCount(0);
  await expect(page.getByLabel("Personal Website / Portfolio URL")).toHaveCount(0);
  await expect(page.getByLabel("Video Introduction URL")).toHaveCount(0);
  await expect(page.getByLabel("Social Media Link")).toHaveCount(0);
  await expect(page.getByLabel("Additional Links")).toBeVisible();
  await expect(
    page.getByText(
      "Optional. Feel free to share anything helpful, such as LinkedIn, a portfolio, a personal website, or a short introduction video.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Share what sparked your interest, what feels aligned, or anything helpful for a first conversation.",
    ),
  ).toBeVisible();
  await expect(
    page.getByLabel("Yes, I’d be glad to hear from you by email about this opportunity."),
  ).toBeVisible();
  await expect(page.getByLabel("Yes, you may text me about this inquiry.")).toHaveCount(0);
});

test("curiosity path uses the tighter field set", async ({ page }) => {
  await page.goto("/?interestPath=find_out_whats_coming#contact");

  await expect(page.getByLabel("I’m curious what’s coming to Raleigh")).toBeChecked();
  await expect(page.getByLabel("First Name")).toBeVisible();
  await expect(page.getByLabel("Last Name")).toBeVisible();
  await expect(page.getByLabel("Email Address")).toBeVisible();
  await expect(page.getByLabel("Mobile Phone Number")).toBeVisible();
  await expect(
    page.getByLabel(
      "Yes, I’d be glad to hear from you by email and phone as plans take shape.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Interest Type")).toHaveCount(0);
  await expect(page.getByLabel("Short Note")).toHaveCount(0);
  await expect(
    page.getByLabel(
      "Yes, I agree to receive text messages about launch updates, pre-sales, and Founding Member VIP offers.",
    ),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Find Out What’s Coming" })).toBeVisible();
});

test("mobile navigation uses a compact menu pattern and closes after selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.locator(".site-navigation__menu-button");
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-label", "Open navigation menu");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-label", "Close navigation menu");
  await expect(page.locator("body")).toHaveClass(/body--menu-open/);

  const aboutLink = page.getByRole("link", { name: "About", exact: true }).last();
  await expect(aboutLink).toBeVisible();
  await aboutLink.click();

  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toHaveAttribute("aria-label", "Open navigation menu");
  await expect(page.locator("body")).not.toHaveClass(/body--menu-open/);
  await expect(page).toHaveURL(/#about$/);

  await menuButton.click();
  const stayConnectedLink = page
    .locator("#site-navigation-links")
    .getByRole("link", { name: "Find Out What’s Coming", exact: true });
  await expect(stayConnectedLink).toBeVisible();
  await stayConnectedLink.click();

  await expect(page).toHaveURL(/#contact$/);
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
});

test("manager deep link lands on the role pill instead of overshooting into the heading", async ({ page }) => {
  await page.goto("/#manager-studio-development");

  const rolePill = page.getByRole("link", { name: "Studio Development Manager", exact: true });
  const heading = page.getByRole("heading", { name: "Help launch Raleigh’s next premium wellness destination." });

  await expect
    .poll(async () => {
      const rolePillBox = await rolePill.boundingBox();
      return rolePillBox?.y ?? Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(140);

  const rolePillBox = await rolePill.boundingBox();
  const headingBox = await heading.boundingBox();
  expect(headingBox.y).toBeGreaterThan(rolePillBox.y + 40);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#manager-studio-development");

  await expect
    .poll(async () => {
      const mobileRolePillBox = await page
        .getByRole("link", { name: "Studio Development Manager", exact: true })
        .boundingBox();
      return mobileRolePillBox?.y ?? Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(150);

  const mobileRolePillBox = await page
    .getByRole("link", { name: "Studio Development Manager", exact: true })
    .boundingBox();
  const mobileHeadingBox = await page
    .getByRole("heading", { name: "Help launch Raleigh’s next premium wellness destination." })
    .boundingBox();
  expect(mobileHeadingBox.y).toBeGreaterThan(mobileRolePillBox.y + 36);
});

test("each form path shows the approved success state after a valid submission", async ({ page }) => {
  // Mock the submission endpoint so this test runs without a real Apps Script deployment.
  // The endpoint variable may not be configured in all CI environments.
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    const isSubmissionEndpoint =
      url.includes("script.google.com") || url.includes("macros");
    if (isSubmissionEndpoint && route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, message: "Recorded", sheet_name: "work_with_us", row_number: 1 }),
      });
    } else {
      await route.continue();
    }
  });

  // Inject a fake endpoint so the gateway doesn't throw before fetching.
  await page.addInitScript(() => {
    window.__RaleighPremiumWellnessFormEndpoint =
      "https://script.google.com/macros/s/test-mock/exec";
  });

  await page.goto("/?interestPath=work_with_us#contact");

  await page.getByLabel("First Name").fill("Roman");
  await page.getByLabel("Last Name").fill("Bediner");
  await page.getByLabel("Email Address").fill("roman@example.com");
  await page.getByRole("textbox", { name: /Short Message/ }).fill("I’d love to be considered for this opportunity.");
  await page.getByLabel("Yes, I’d be glad to hear from you by email about this opportunity.").check();
  await page.getByRole("button", { name: "Start the Conversation" }).click();

  await expect(
    page.getByText(
      "Thanks for reaching out. We’ve received your note and will review it carefully. If there looks to be a strong fit, we’ll be in touch about next steps.",
    ),
  ).toBeVisible();

  await page.goto("/?interestPath=partner_with_us#contact");

  await page.getByLabel("First Name").fill("Roman");
  await page.getByLabel("Last Name").fill("Bediner");
  await page.getByLabel("Business / Organization Name").fill("Bediner Wellness Circle");
  await page.getByLabel("Email Address").fill("roman@example.com");
  await page.getByLabel("Mobile Phone Number").fill("919-555-0100");
  await page.getByLabel("Partnership Type").selectOption("Community Partnership");
  await page.getByRole("textbox", { name: /Partnership Idea/ }).fill("A neighborhood collaboration could be a strong fit.");
  await page.getByLabel("Yes, I’d be glad to hear from you by email about this opportunity.").check();
  await page.getByRole("button", { name: "Explore a Partnership" }).click();

  await expect(
    page.getByText(
      "Thanks so much for reaching out. We’re grateful for your interest and excited to learn more about you, your business, and the kind of collaboration you have in mind. We’ll review your note and be back in touch soon.",
    ),
  ).toBeVisible();

  await page.goto("/?interestPath=find_out_whats_coming#contact");

  await page.getByLabel("First Name").fill("Marianna");
  await page.getByLabel("Last Name").fill("Bediner");
  await page.getByLabel("Email Address").fill("marianna@example.com");
  await page.getByLabel("Mobile Phone Number").fill("919-555-0100");
  await page
    .getByLabel(
      "Yes, I’d be glad to hear from you by email and phone as plans take shape.",
    )
    .check();
  await page.getByRole("button", { name: "Find Out What’s Coming" }).click();

  await expect(
    page.getByText(
      "Thanks for reaching out. We’ve received your note and will follow up with more information as plans take shape.",
    ),
  ).toBeVisible();
});
