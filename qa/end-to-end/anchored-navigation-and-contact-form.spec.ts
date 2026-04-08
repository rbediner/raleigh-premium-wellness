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
  await expect(page.getByRole("button", { name: /partnership/i })).toBeVisible();

  await page.getByLabel("I want to stay connected").check();
  await expect(
    page.getByLabel(
      "Yes, I’d like to receive email updates about launch news, pre-sales, and Founding Member VIP offers.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /join the list/i })).toBeVisible();
});

test("section calls-to-action hand off into the matching contact flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Join the Early Access List", exact: true }).click();

  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByLabel("I want to stay connected")).toBeChecked();
  await expect(page.getByRole("button", { name: /join the list/i })).toBeVisible();
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
