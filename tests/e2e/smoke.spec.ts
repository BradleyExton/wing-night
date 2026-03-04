import { expect, test } from "@playwright/test";

const HOST_PRIMARY_ACTION_LABEL = /Lock Teams & Continue|Start Game|Open Team Briefing|Start Eating|Start Mini-Game|End Team Turn|Prepare Next Team|Show Round Results|Start Next Round|Show Final Results|Next Phase/;

test("host route renders host shell", async ({ page }) => {
  await page.goto("/host");

  await expect(page.locator("header").getByText("Host", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: HOST_PRIMARY_ACTION_LABEL })).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});

test("display route renders display shell", async ({ page }) => {
  await page.goto("/display");

  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByText("Content Load Error")).toHaveCount(0);
});
