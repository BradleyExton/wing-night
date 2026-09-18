import { expect, test, type Page } from "@playwright/test";

// The package dev manifest pins seed 20260916 on a 13×7 grid, which puts the
// crosshair at (6,3) and target 1 at (7,5): one Right, two Down.
const NUDGES_TO_FIRST_TARGET = ["Right", "Down", "Down"] as const;

// Longer than FIRE_HOLD_MS (400) in the host surface; shorter than it for the
// tap that must NOT fire.
const HOLD_MS = 700;
const TAP_MS = 80;

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

const pressFire = async (page: Page, durationMs: number): Promise<void> => {
  const fireButton = page.getByRole("button", { name: "Fire" });

  await fireButton.hover();
  await page.mouse.down();
  await page.waitForTimeout(durationMs);
  await page.mouse.up();
};

test("spotter sandbox mirrors nudges to the field and scores a held fire", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/spotter");

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both surfaces agree on the target count; only the display has the field.
  await expect(page.getByText("Target 1 of 5")).toHaveCount(2);
  await expect(page.locator("[data-spotter-target]")).toHaveCount(5);
  await expect(page.locator("[data-spotter-crosshair]")).toHaveCount(1);
  await expect(page.locator("[data-spotter-trail]")).toHaveCount(0);

  for (const direction of NUDGES_TO_FIRST_TARGET) {
    await page.getByRole("button", { name: direction }).click();
  }

  // Three nudges → a four-cell trail on the TV, a bare count on the tablet.
  await expect(page.locator('[data-spotter-trail="4"]')).toHaveCount(1);
  await expect(page.getByText("3 nudges")).toBeVisible();

  // A short tap on FIRE is a stray tap and must not resolve the target.
  await pressFire(page, TAP_MS);
  await expect(page.getByText("Target 1 of 5")).toHaveCount(2);
  await expect(page.locator("[data-spotter-shot]")).toHaveCount(0);

  await pressFire(page, HOLD_MS);

  await expect(page.getByText("Target 2 of 5")).toHaveCount(2);
  await expect(page.locator('[data-spotter-shot="HIT"]')).toHaveCount(1);
  await expect(page.getByText("Hit! +3")).toBeVisible();
  await expect(page.getByText("+3 pending")).toHaveCount(2);
  await expect(page.locator("[data-spotter-trail]")).toHaveCount(0);
  await expect(page.getByText("0 nudges")).toBeVisible();

  expect(socketRequests).toHaveLength(0);
});

test("keyboard fire resolves the target immediately", async ({ page }) => {
  await page.goto("/dev/minigame/spotter");

  await page.getByRole("button", { name: "Fire" }).focus();
  await page.keyboard.press("Enter");

  // Fired from centre, three cells from target 1: a miss, but it still resolves.
  await expect(page.getByText("Target 2 of 5")).toHaveCount(2);
  await expect(page.locator('[data-spotter-shot="MISS"]')).toHaveCount(1);
  await expect(page.getByText("Miss", { exact: true })).toBeVisible();
});

test("the sandbox reset button restores a fresh field", async ({ page }) => {
  await page.goto("/dev/minigame/spotter");

  await page.getByRole("button", { name: "Right" }).click();
  await pressFire(page, HOLD_MS);

  await expect(page.getByText("Target 2 of 5")).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Target 1 of 5")).toHaveCount(2);
  await expect(page.locator("[data-spotter-shot]")).toHaveCount(0);
  await expect(page.locator("[data-spotter-trail]")).toHaveCount(0);
});
