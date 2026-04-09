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

  await page.getByLabel("I want to stay connected").check();
  await expect(
    page.getByLabel(
      "Yes, I’d like to receive email updates about launch news, pre-sales, and Founding Member VIP offers.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /join the list/i })).toBeVisible();
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
  await expect(page.getByLabel("I want to stay connected")).toBeChecked();
  await expect(page.getByRole("button", { name: /join the list/i })).toBeVisible();
});

test("partner path keeps partnership-specific helper chips only", async ({ page }) => {
  await page.goto("/?interestPath=partner_with_us#contact");

  await expect(page.getByLabel("I want to partner with you")).toBeChecked();
  await expect(page.getByText("Partnership idea", { exact: true })).toBeVisible();
  await expect(page.getByText("Audience/community", { exact: true })).toBeVisible();
  await expect(page.getByText("Why I’m interested", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Referral opportunity", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /Partnership Idea/ })).toBeVisible();
});

test("work path uses the Studio Development Manager label consistently and adapts for referrals", async ({ page }) => {
  await page.goto("/?interestPath=work_with_us#contact");

  await expect(page.getByLabel("Role of Interest")).toHaveValue("Studio Development Manager");
  await expect(page.locator("option[value='Manager-Studio Development']")).toHaveCount(0);

  await page.getByLabel("Are you reaching out for yourself or referring someone?").selectOption("I’d like to refer someone");

  await expect(page.getByText("Referring Person Details", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Your First Name")).toBeVisible();
  await expect(page.getByText("About the Person You’re Referring", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share a Referral" })).toBeVisible();
});

test("mobile navigation uses a compact menu pattern and closes after selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: /open navigation menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const aboutLink = page.getByRole("link", { name: "About", exact: true }).last();
  await expect(aboutLink).toBeVisible();
  await aboutLink.click();

  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(page).toHaveURL(/#about$/);
});

test("each form path shows the approved success state after a valid submission", async ({ page }) => {
  await page.goto("/?interestPath=work_with_us#contact");

  await page.getByLabel("First Name").fill("Roman");
  await page.getByLabel("Last Name").fill("Bediner");
  await page.getByLabel("Email Address").fill("roman@example.com");
  await page.getByLabel("Mobile Phone Number").fill("919-555-0100");
  await page.getByRole("textbox", { name: /Short Message/ }).fill("I’d love to be considered for this opportunity.");
  await page.getByLabel("Yes, you may email me about this inquiry.").check();
  await page.getByLabel("Yes, you may text me about this inquiry.").check();
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
  await page
    .getByLabel(
      "Yes, I’d like to receive email updates about launch news, pre-sales, and Founding Member VIP offers.",
    )
    .check();
  await page.getByRole("button", { name: "Join the List" }).click();

  await expect(
    page.getByText(
      "Thank you so much for joining us early. We’re truly grateful for your interest and excited to keep you in the loop as launch plans take shape. We’ll share updates along the way and let you know as soon as founding-member opportunities become available. If you know someone in your circle who’d want to be part of this early, feel free to share the page with them.",
    ),
  ).toBeVisible();
});
