import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { readSeededLinks, resolveScreenshotPath } from "./portalStack.ts";

// The guest portal against wrangler dev (local D1/R2, logged mail, the fake painter) through the
// teaser's Vite proxy, on a phone. In order, because each step builds on the last: Rob makes his
// head and picks a team (and Sam finds it full), Rob is kept out of Brad's page, then Brad runs
// the team board and the list. The stack seeds three guests and three teams, so every team has
// exactly one seat (resolveTeamSeatCap) until Brad adds a fourth guest.
test.describe.configure({ mode: "serial" });

// Against the repo root, never `import.meta.url`: Playwright transpiles specs to CommonJS
// (tools/e2e-content-root explains).
const PHOTO_FIXTURE = join(process.cwd(), "tests/e2e-portal/fixtures/guest-photo.png");

const signIn = async (page: Page, linkPath: string): Promise<void> => {
  await page.goto(linkPath);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/me$/);
};

const teamTile = (page: Page, teamName: string) =>
  page.locator(`[data-testid="team-tile"][data-team-name="${teamName}"]`);

// The studio's big bird, with a kept head or still waiting for one: its stage says which team
// colour it is painted in.
const studioBird = (page: Page) =>
  page.getByRole("img", { name: /^Your (head on your bird|bird, still waiting for a head)$/ });

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

test("a guest signs in, paints and keeps a head, and picks a team that repaints the bird and survives a reload", async ({
  page,
  browser
}, testInfo) => {
  const links = readSeededLinks();
  const [firstTeam, secondTeam] = links.teams;

  if (firstTeam === undefined || secondTeam === undefined) {
    throw new Error("The e2e stack seeded fewer than two teams.");
  }

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
  const keptBird = studioBird(page);
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

  // Sam opens his page BEFORE Rob picks, so his tiles still show the seat as open: the stale
  // client the Worker has to refuse.
  const samContext = await browser.newContext({ ...testInfo.project.use, viewport: { width: 390, height: 844 } });
  const samPage = await samContext.newPage();
  await signIn(samPage, links.guestWithoutEmail);
  await expect(samPage.getByRole("heading", { level: 1 })).toHaveText("Hey, Sam.");
  await expect(teamTile(samPage, firstTeam)).toBeEnabled();
  await expect(teamTile(samPage, firstTeam).getByTestId("team-seats")).toContainText("0 of 1");

  // No pick yet: the stock bird. Tapping a tile saves at once and repaints the bird above.
  await expect(keptBird).toHaveAttribute("data-team-color", "none");
  const firstTile = teamTile(page, firstTeam);
  await firstTile.click();
  await expect(firstTile).toHaveAttribute("aria-pressed", "true");
  const teamColor = await firstTile.getAttribute("data-team-color");
  expect(teamColor).not.toBeNull();
  expect(teamColor).not.toBe("none");
  await expect(keptBird).toHaveAttribute("data-team-color", teamColor ?? "");
  await expect(firstTile.getByTestId("team-seats")).toContainText("1 of 1");
  await expect(firstTile.locator('[data-testid="team-member"]')).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, Rob.");
  await expect(teamTile(page, firstTeam)).toHaveAttribute("aria-pressed", "true");
  await expect(studioBird(page)).toHaveAttribute("data-team-color", teamColor ?? "");
  await expect(studioBird(page)).toBeVisible();
  await expect(page.getByTestId("avatar-tries-left")).toHaveText("4 / 5");

  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-390x844.png"), fullPage: true });
  await teamTile(page, firstTeam).scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-team-390x844.png") });

  // Sam taps the seat Rob just took: the Worker refuses, the bird snaps back, the tile fills.
  await teamTile(samPage, firstTeam).click();
  await expect(samPage.getByRole("status").filter({ hasText: "That team just filled up." })).toBeVisible();
  await expect(studioBird(samPage)).toHaveAttribute("data-team-color", "none");
  await expect(teamTile(samPage, firstTeam)).toBeDisabled();
  await expect(teamTile(samPage, firstTeam)).toContainText("Full");
  await expect(teamTile(samPage, firstTeam)).not.toHaveAttribute("aria-pressed", "true");

  // The refusal is the Worker's, not the tile's: a request straight past the dimmed tile fails the same way.
  const refusal = await samPage.evaluate(async (teamName) => {
    const response = await fetch("/api/me/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName })
    });

    return { status: response.status, body: await response.json() };
  }, firstTeam);
  expect(refusal).toEqual({ status: 409, body: { error: "team_full" } });

  await teamTile(samPage, secondTeam).click();
  await expect(teamTile(samPage, secondTeam)).toHaveAttribute("aria-pressed", "true");
  await expect(studioBird(samPage)).not.toHaveAttribute("data-team-color", "none");
  await samContext.close();

  // Turned on its side, the bird never takes the whole first screen.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const stage = await studioBird(page).boundingBox();
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

test("the admin runs the team board, closes picks, adds a guest, mints a link and picks the style reference", async ({
  page,
  browser
}, testInfo) => {
  const links = readSeededLinks();
  const [firstTeam, secondTeam, thirdTeam] = links.teams;

  if (firstTeam === undefined || secondTeam === undefined || thirdTeam === undefined) {
    throw new Error("The e2e stack seeded fewer than three teams.");
  }

  await signIn(page, links.admin);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, Brad.");
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The guest list.");

  const robRow = page.locator('[data-testid="admin-guest-row"][data-guest-name="Rob"]');
  await expect(robRow).toContainText("Signed in");
  await expect(robRow).toContainText("Head");
  await expect(robRow).toContainText(firstTeam);

  // The board: Rob on the first team, Sam on the second, the third empty, Brad unseated.
  const column = (teamName: string) => page.locator(`[data-testid="admin-team-column"][data-team-name="${teamName}"]`);
  const member = (name: string) => page.locator(`[data-testid="admin-team-member"][data-guest-name="${name}"]`);
  await expect(column(firstTeam).locator(member("Rob"))).toHaveCount(1);
  await expect(column(secondTeam).locator(member("Sam"))).toHaveCount(1);
  await expect(column(thirdTeam).locator('[data-testid="admin-team-member"]')).toHaveCount(0);
  await expect(page.getByTestId("admin-unseated").locator(member("Brad"))).toHaveCount(1);
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-admin-390x844.png"), fullPage: true });

  // Brad moves Rob onto the empty team; the cap never applies to him.
  await page.getByLabel("Move Rob").selectOption({ label: thirdTeam });
  await expect(column(thirdTeam).locator(member("Rob"))).toHaveCount(1);
  await expect(column(firstTeam).locator(member("Rob"))).toHaveCount(0);
  await expect(robRow).toContainText(thirdTeam);

  // Closing picks: the switch flips, and Rob's tiles go inert on his phone while his pick shows.
  const picksSwitch = page.getByRole("switch", { name: "Picks are open" });
  await expect(picksSwitch).toHaveAttribute("aria-checked", "true");
  await picksSwitch.click();
  await expect(page.getByRole("switch", { name: "Picks are closed" })).toHaveAttribute("aria-checked", "false");

  const robContext = await browser.newContext({ ...testInfo.project.use, viewport: { width: 390, height: 844 } });
  const robPage = await robContext.newPage();
  await signIn(robPage, links.guest);
  await expect(robPage.getByText("Teams are set.")).toBeVisible();
  await expect(teamTile(robPage, thirdTeam)).toHaveAttribute("aria-pressed", "true");
  for (const teamName of links.teams) {
    await expect(teamTile(robPage, teamName)).toBeDisabled();
  }
  const closedRefusal = await robPage.evaluate(async (teamName) => {
    const response = await fetch("/api/me/team", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName })
    });

    return { status: response.status, body: await response.json() };
  }, firstTeam);
  expect(closedRefusal).toEqual({ status: 409, body: { error: "picks_closed" } });
  await robPage.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "portal-me-closed-390x844.png"), fullPage: true });
  await robContext.close();

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
