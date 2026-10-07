import { expect, test } from "@playwright/test";

// The teaser's public pages are untouched by the portal: the landing, a game and the share
// card still draw, and a signed-out visit to /me lands on the sign-in page, whose answer never
// says whether an address is on the list.
test("the landing, a game page and the share card still draw", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wing Night");
  await expect(page.getByRole("link", { name: /Dunlop Dash/ })).toBeVisible();

  await page.goto("/dunlop-dash");
  await expect(page.getByText("Dunlop Dash").first()).toBeVisible();

  await page.goto("/card");
  await expect(page.locator("[data-teaser-share-card]")).toBeVisible();

  expect(errors).toEqual([]);
});

test("a signed-out guest is sent from /me to sign in, and asking for a link gives the one answer", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to the night.");

  await page.getByLabel("Your email").fill("nobody@example.test");
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "If that address is on the guest list, a link is on its way. It works for 30 minutes."
  );
});
