import { expect, test } from "@playwright/test";

test("host route renders host shell", async ({ page }) => {
  await page.goto("/host");

  await expect(page.locator("header").getByText("Host", { exact: true })).toBeVisible();
  await expect(page.locator("h1", { hasText: /setup|waiting for room state/i })).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});

test("display route renders display shell", async ({ page }) => {
  await page.goto("/display");

  await expect(page.getByRole("heading", { name: "Wing Night" })).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});
