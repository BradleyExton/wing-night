import { expect, test } from "@playwright/test";

import { HOST_PRIMARY_ACTION_LABEL } from "./hostShell";

test("host route renders host shell", async ({ page }) => {
  await page.goto("/host");

  await expect(
    page.getByRole("button", { name: HOST_PRIMARY_ACTION_LABEL })
  ).toBeVisible();
  await expect(
    page.locator("header").getByText(/Pre-game|Round \d+ of \d+/)
  ).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});

test("display route renders display shell", async ({ page }) => {
  await page.goto("/display");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});
