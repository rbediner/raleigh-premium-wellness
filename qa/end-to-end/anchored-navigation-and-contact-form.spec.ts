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

  await page.getByLabel("I want to partner with you").check();
  await expect(page.getByLabel("Business or Organization Name")).toBeVisible();
  await expect(page.getByRole("button", { name: /partnership/i })).toBeVisible();

  await page.getByLabel("I want to stay connected").check();
  await expect(
    page.getByLabel(
      "I consent to email updates about launch news, pre-sales updates, and Founding Member VIP offers.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /stay connected/i })).toBeVisible();
});
