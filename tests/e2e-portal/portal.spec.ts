import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { readSeededLinks, resolveScreenshotPath } from "./portalStack.ts";

// The guest portal against wrangler dev (local D1/R2, logged mail, the fake painter) through the
// teaser's Vite proxy, on a phone. In order, because each step builds on the last: Rob makes his
// head and votes, Rob is kept out of Brad's page, then Brad sees what Rob did and runs the list.
test.describe.configure({ mode: "serial" });

// Against the repo root, never `import.meta.url`: Playwright transpiles specs to CommonJS
// (tools/e2e-content-root explains).
const PHOTO_FIXTURE = join(process.cwd(), "tests/e2e-portal/fixtures/guest-photo.png");

const signIn = async (page: Page, linkPath: string): Promise<void> => {
  await page.goto(linkPath);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/me$/);
};

// The keyed head, read back off the page: some of it clear, some of it solid, and no solid
// magenta left anywhere — the browser keyed what the painter sent.
const readHeadAlpha = (page: Page, href: string): Promise<{ clear: number; solid: number; magenta: number }> =>
  page.evaluate(async (src) => {
    const bitmap = await createImageBitmap(await (await fetch(src)).blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("no 2d context");
    }

    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const counts = { clear: 0, solid: 0, magenta: 0 };

    for (let offset = 0; offset < data.length; offset += 4) {
      if (data[offset + 3] === 0) counts.clear += 1;
      if (data[offset + 3] === 255) counts.solid += 1;
      if (data[offset + 3] > 0 && data[offset] > 230 && data[offset + 1] < 30 && data[offset + 2] > 230) counts.magenta += 1;
    }

    return counts;
  }, href);

test("a guest signs in, paints and keeps a head, and saves a vote that survives a reload", async ({ page }, testInfo) => {
  const links = readSeededLinks();

  await signIn(page, links.guest);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, Rob.");
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("5 / 5");

  await page.getByLabel("Pick a photo").setInputFiles(PHOTO_FIXTURE);
  await expect(page.getByText("Photo ready")).toBeVisible();
  await page.getByRole("button", { name: "Paint my head" }).click();

  const previewBird = page.getByRole("img", { name: "Your painted head on your bird, not kept yet" });
  await expect(previewBird).toBeVisible();
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("4 / 5");
  const previewHref = await previewBird.locator("image").getAttribute("href");
  expect(previewHref).toMatch(/^blob:/);
  const keyed = await readHeadAlpha(page, previewHref ?? "");
  expect(keyed.clear).toBeGreaterThan(0);
  expect(keyed.solid).toBeGreaterThan(0);
  expect(keyed.magenta).toBe(0);
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-studio-preview-390x844.png") });

  // An unkept paint is a spent try: leaving the page asks first.
  const leaving = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const warning = await leaving;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await expect(previewBird).toBeVisible();

  await page.getByRole("button", { name: "Keep this one" }).click();
  const keptBird = page.getByRole("img", { name: "Your head on your bird" });
  await expect(keptBird).toBeVisible();
  await expect(keptBird.locator("image")).toHaveAttribute("href", /^\/api\/me\/avatar\?v=[0-9a-f]{64}$/);
  await expect(page.getByText("Photo ready")).toHaveCount(0);
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("4 / 5");

  // A photo picked and then thought better of goes back unpainted.
  await page.getByLabel("Pick a photo").setInputFiles(PHOTO_FIXTURE);
  await expect(page.getByText("Photo ready")).toBeVisible();
  await page.getByRole("button", { name: "Remove my photo" }).click();
  await expect(page.getByText("Photo ready")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Paint my head" })).toHaveCount(0);
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("4 / 5");

  await page.getByRole("button", { name: "Rank Metal" }).click();
  await page.getByRole("button", { name: "Rank Disco" }).click();
  await page.getByRole("button", { name: "Move Disco up" }).click();
  await page.getByRole("button", { name: "Brad" }).click();
  await page.getByLabel("A random draw on the TV").check();
  await page.getByRole("button", { name: "Save my vote" }).click();
  await expect(page.getByText("Saved. Change it any time before the night.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, Rob.");
  const ranking = page.getByTestId("genre-ranking").locator("li");
  await expect(ranking).toHaveCount(2);
  await expect(ranking.nth(0)).toContainText("Disco");
  await expect(ranking.nth(1)).toContainText("Metal");
  await expect(page.getByRole("button", { name: "Brad" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("A random draw on the TV")).toBeChecked();
  await expect(page.getByRole("img", { name: "Your head on your bird" })).toBeVisible();
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("4 / 5");

  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-390x844.png"), fullPage: true });
  await page.getByRole("button", { name: "Save my vote" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-vote-390x844.png") });

  // Turned on its side, the bird never takes the whole first screen.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const stage = await page.getByRole("img", { name: "Your head on your bird" }).boundingBox();
  expect(stage?.height ?? 390).toBeLessThanOrEqual(390 * 0.4);
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-844x390.png") });
});

test("a guest who is not an admin is refused the admin page and the admin API", async ({ page }) => {
  await signIn(page, readSeededLinks().guest);

  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is Brad's.");

  const refusals = await page.evaluate(async () => {
    const list = await fetch("/api/admin/guests");
    const pick = await fetch("/api/admin/style-reference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: "g_anyone" })
    });

    return { list: list.status, pick: pick.status, pickBody: await pick.json() };
  });

  expect(refusals).toEqual({ list: 403, pick: 403, pickBody: { error: "forbidden" } });
});

test("the admin sees the guest's head and vote, adds a guest, mints a link and picks the style reference", async ({
  page,
  browser
}, testInfo) => {
  await signIn(page, readSeededLinks().admin);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, Brad.");
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The guest list.");

  const robRow = page.locator('[data-testid="admin-guest-row"][data-guest-name="Rob"]');
  await expect(robRow).toContainText("Signed in");
  await expect(robRow).toContainText("Head");
  await expect(robRow).toContainText("Voted");

  await expect(page.locator('[data-genre="disco"]')).toHaveAttribute("data-points", "9");
  await expect(page.locator('[data-genre="metal"]')).toHaveAttribute("data-points", "8");
  await expect(page.locator('[data-format="random_draw"]')).toContainText("1");
  await expect(page.getByTestId("admin-not-voted")).toHaveText("Brad, Sam");
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-admin-390x844.png"), fullPage: true });

  await page.getByRole("button", { name: "Add a guest" }).click();
  await page.getByLabel("Name").fill("Jess");
  await page.getByLabel("Email (optional)").fill("jess@example.test");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const jessRow = page.locator('[data-testid="admin-guest-row"][data-guest-name="Jess"]');
  await expect(jessRow).toContainText("Not invited");

  await jessRow.getByRole("button", { name: "Link" }).click();
  const jessLink = jessRow.getByLabel("Jess's sign-in link");
  await expect(jessLink).toHaveValue(/^http:\/\/localhost:\d+\/s\/[A-Za-z0-9_-]{43}$/);
  const jessUrl = await jessLink.inputValue();

  await robRow.getByRole("button", { name: "Re-invite" }).click();
  await expect(robRow.getByRole("status")).toHaveText("Invite sent.");

  await expect(robRow).toContainText("Tries 4/5");
  await robRow.getByRole("button", { name: "Reset tries" }).click();
  await expect(robRow.getByRole("status")).toHaveText("Tries back to 5, and any photo they left is deleted.");
  await expect(robRow).toContainText("Tries 5/5");
  await expect(robRow).toContainText("Head");

  const robTile = page.locator('[data-testid="admin-head-tile"][data-guest-name="Rob"]');
  await robTile.getByRole("button", { name: "Use as style" }).click();
  await expect(robTile).toContainText("Style");
  await expect(robTile.getByRole("button", { name: "Use as style" })).toHaveCount(0);

  await page.getByRole("button", { name: "Invite 1 more" }).click();
  await expect(page.getByText("1 sent.")).toBeVisible();
  await expect(jessRow).toContainText("Invited");
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-admin-after-390x844.png"), fullPage: true });

  // The minted link was the one invite-everyone then replaced, so it is spent; the emailed one
  // is in the Worker's log. Mint a fresh one and prove it signs Jess in on another phone.
  await jessRow.getByRole("button", { name: "Link" }).click();
  await expect(jessLink).not.toHaveValue(jessUrl);
  const freshPath = new URL(await jessLink.inputValue()).pathname;
  const jessContext = await browser.newContext({ ...testInfo.project.use, viewport: { width: 390, height: 844 } });
  const jessPage = await jessContext.newPage();
  await signIn(jessPage, freshPath);
  await expect(jessPage.getByRole("heading", { level: 1 })).toHaveText("Hey, Jess.");
  await jessContext.close();
});
