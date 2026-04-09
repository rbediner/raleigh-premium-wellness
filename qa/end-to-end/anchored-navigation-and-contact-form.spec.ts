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
    page.getByRole("heading", { name: "Help launch Raleigh’s next premium wellness destination." }),
  ).toBeVisible();

  await page.getByLabel("I want to partner with you").check();
  await expect(page.getByLabel("Business / Organization Name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore a Partnership" })).toBeVisible();

  await page.getByLabel("I want to join the Founding Member VIP list").check();
  await expect(
    page.getByLabel("I want to join the Founding Member VIP list"),
  ).toBeChecked();
  await expect(
    page.getByLabel(
      "Yes, I’d be glad to receive email updates as launch plans take shape and founding-member opportunities become available.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Join the VIP List" })).toBeVisible();
  await expect(
    page.getByText(
      "Founding Member VIP is for people who want to be first in line when our founding-member offers become available.",
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
  await page.locator(".hero-section__actions").getByRole("link", { name: "Stay Connected", exact: true }).click();
  await expect(page).toHaveURL(/interestPath=stay_connected/);
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByLabel("I want to join the Founding Member VIP list")).toBeChecked();
  await expect(page.getByRole("button", { name: "Join the VIP List" })).toBeVisible();
});

test("partner path keeps partnership-specific helper chips only", async ({ page }) => {
  await page.goto("/?interestPath=partner_with_us#contact");

  await expect(page.getByLabel("I want to partner with you")).toBeChecked();
  await expect(page.getByText("Partnership idea", { exact: true })).toBeVisible();
  await expect(page.getByText("Audience/community", { exact: true })).toBeVisible();
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

test("vip path uses the tighter founding-member field set", async ({ page }) => {
  await page.goto("/?interestPath=stay_connected#contact");

  await expect(page.getByLabel("I want to join the Founding Member VIP list")).toBeChecked();
  await expect(page.getByLabel("First Name")).toBeVisible();
  await expect(page.getByLabel("Last Name")).toBeVisible();
  await expect(page.getByLabel("Email Address")).toBeVisible();
  await expect(page.getByLabel("Mobile Phone Number")).toBeVisible();
  await expect(
    page.getByLabel(
      "Yes, I’d be glad to receive email updates as launch plans take shape and founding-member opportunities become available.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Interest Type")).toHaveCount(0);
  await expect(page.getByLabel("Short Note")).toHaveCount(0);
  await expect(
    page.getByLabel(
      "Yes, I agree to receive text messages about launch updates, pre-sales, and Founding Member VIP offers.",
    ),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Join the VIP List" })).toBeVisible();
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
});

test("each form path shows the approved success state after a valid submission", async ({ page }) => {
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
  await page.getByLabel("Partnership Type").selectOption("Community partnership");
  await page.getByRole("textbox", { name: /Partnership Idea/ }).fill("A neighborhood collaboration could be a strong fit.");
  await page.getByLabel("Yes, I’d be glad to hear from you by email about this opportunity.").check();
  await page.getByRole("button", { name: "Explore a Partnership" }).click();

  await expect(
    page.getByText(
      "Thanks so much for reaching out. We’re grateful for your interest and excited to learn more about you, your business, and the kind of collaboration you have in mind. We’ll review your note and be back in touch soon.",
    ),
  ).toBeVisible();

  await page.goto("/?interestPath=stay_connected#contact");

  await page.getByLabel("First Name").fill("Marianna");
  await page.getByLabel("Last Name").fill("Bediner");
  await page.getByLabel("Email Address").fill("marianna@example.com");
  await page.getByLabel("Mobile Phone Number").fill("919-555-0100");
  await page
    .getByLabel(
      "Yes, I’d be glad to receive email updates as launch plans take shape and founding-member opportunities become available.",
    )
    .check();
  await page.getByRole("button", { name: "Join the VIP List" }).click();

  await expect(
    page.getByText(
      "Thank you so much for joining us early. We’re truly grateful for your interest and excited to keep you in the loop as launch plans take shape. We’ll share updates along the way and let you know as soon as founding-member opportunities become available. If you know someone in your circle who’d want to be part of this early, feel free to share the page with them.",
    ),
  ).toBeVisible();
});
