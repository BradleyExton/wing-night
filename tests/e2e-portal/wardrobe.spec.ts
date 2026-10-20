import { expect, test, type Page } from "@playwright/test";

import type { AdminGuestExport } from "../../packages/shared/src/guestPortal/export/index.ts";
import { planPull } from "../../tools/pull-guests/planPull/index.ts";
import { readSeededLinks, resolveScreenshotPath } from "./portalStack.ts";

// The bird's wardrobe on a phone (docs/research/bird-wardrobe.md §2.5), end to end: Rob dresses
// his bird for his team, keeps it through a reload, is seated on a team of another genre and finds
// a bare bird there that he dresses too, comes back to the first outfit, then strips the bird
// bare — and the export Brad's `pnpm pack:pull` reads carries every genre, the stripped one as
// `{}`, which undresses the pack's bird. Brad seats Rob with the admin route, so this file needs
// nothing from portal.spec.ts but the seeded guests: the cap and the picks switch never apply to
// him.
test.describe.configure({ mode: "serial" });

const signIn = async (page: Page, linkPath: string): Promise<void> => {
  await page.goto(linkPath);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/me$/);
};

// Brad's admin routes, from his signed-in page: a guest by name, a seat (the cap and the picks
// switch never apply to him), and a fresh personal link — the seeded one is spent once
// portal.spec.ts has re-invited Rob, and this file asks nothing of that one.
const findGuestId = async (adminPage: Page, displayName: string): Promise<string> => {
  const guestId = await adminPage.evaluate(async (name) => {
    const guests = (await (await fetch("/api/admin/guests")).json()) as { guestId: string; displayName: string }[];

    return guests.find((entry) => entry.displayName === name)?.guestId ?? null;
  }, displayName);

  if (guestId === null) {
    throw new Error(`The e2e stack seeded no guest called ${displayName}.`);
  }

  return guestId;
};

const seat = async (adminPage: Page, guestId: string, teamName: string): Promise<void> => {
  const status = await adminPage.evaluate(
    async ({ guestId, teamName }) =>
      (
        await fetch(`/api/admin/guests/${guestId}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName })
        })
      ).status,
    { guestId, teamName }
  );

  expect(status).toBe(200);
};

const mintLinkPath = async (adminPage: Page, guestId: string): Promise<string> => {
  const url = await adminPage.evaluate(
    async (id) => ((await (await fetch(`/api/admin/guests/${id}/link`, { method: "POST" })).json()) as { url: string }).url,
    guestId
  );

  return new URL(url).pathname;
};

const status = (page: Page) => page.getByTestId("wardrobe-status");

// Every tap is a save: wait for the last one to land before reading the page back.
const expectSaved = async (page: Page): Promise<void> => {
  await expect(status(page)).toHaveAttribute("data-save-state", "saved");
};

// What the big bird has on, read off the cast's markers, item ids sorted — once the page has
// read the guest and the teams and drawn the bird at all.
const readWornItems = async (page: Page): Promise<string[]> => {
  const bird = page.getByTestId("wardrobe-bird");

  await expect(bird).toBeVisible();

  return bird
    .locator("[data-outfit-item]")
    .evaluateAll((elements) => [...new Set(elements.map((element) => element.getAttribute("data-outfit-item") ?? ""))].sort());
};

const openTab = (page: Page, slot: string) => page.locator(`[data-testid="wardrobe-tab"][data-slot="${slot}"]`).click();

const tile = (page: Page, item: string) => page.locator(`[data-testid="wardrobe-tile"][data-item="${item}"]`);

test("a guest dresses their bird, keeps an outfit per genre across a team switch, and strips it bare for the pull", async ({
  page,
  browser
}, testInfo) => {
  const links = readSeededLinks();
  const [metalTeam, discoTeam] = links.teams;

  if (metalTeam === undefined || discoTeam === undefined) {
    throw new Error("The e2e stack seeded fewer than two teams.");
  }

  const brad = await browser.newContext({ ...testInfo.project.use, viewport: { width: 390, height: 844 } });
  const bradPage = await brad.newPage();
  await signIn(bradPage, links.admin);
  const robId = await findGuestId(bradPage, "Rob");
  await seat(bradPage, robId, metalTeam);

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page, await mintLinkPath(bradPage, robId));

  // /me: the bird card, third, says what the bird has on and opens the wardrobe.
  const birdCard = page.getByTestId("your-bird-card");
  await expect(birdCard.getByTestId("your-bird-summary")).toHaveText("Bare. The silhouette's doing all the work.");
  await birdCard.getByRole("link", { name: "Open the wardrobe" }).click();
  await expect(page).toHaveURL(/\/me\/wardrobe$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dress for the parade");
  expect(await readWornItems(page)).toEqual([]);

  // A Look dresses the whole bird in one tap and saves it; a tile and a swatch change one slot.
  await page.locator('[data-testid="wardrobe-look"][data-look="thrash"]').click();
  await expect(status(page)).toHaveText("Thrash.");
  await expectSaved(page);
  expect(await readWornItems(page)).toEqual(["battle-vest-a", "combat-boots-a", "flying-v-b", "leather-sleeve-a"]);

  await openTab(page, "prop");
  await expect(tile(page, "flying-v-b")).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-testid="wardrobe-style"][data-style="gold"]').click();
  await expectSaved(page);
  await expect(page.locator('[data-testid="wardrobe-look"][data-look="thrash"]')).toHaveAttribute("aria-pressed", "false");
  await openTab(page, "tail");
  await tile(page, "lava-tips-a").click();
  await expect(status(page)).toHaveText("Lava tips.");
  await expectSaved(page);
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "wardrobe-metal-390x844.png"), fullPage: true });

  // A reload reads it back from the Worker, gold Flying V and all.
  await page.reload();
  expect(await readWornItems(page)).toEqual(["battle-vest-a", "combat-boots-a", "flying-v-b", "lava-tips-a", "leather-sleeve-a"]);
  await openTab(page, "prop");
  await expect(page.locator('[data-testid="wardrobe-style"][data-style="gold"]')).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("wardrobe-team").scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "wardrobe-metal-rail-390x844.png") });

  // On a disco team the bird is bare — that genre was never dressed — and has disco's rail.
  await seat(bradPage, robId, discoTeam);
  await page.reload();
  await expect(page.getByText(discoTeam, { exact: true })).toBeVisible();
  expect(await readWornItems(page)).toEqual([]);
  await expect(status(page)).toHaveText("Bare. The silhouette's doing all the work.");
  await openTab(page, "tail");
  await tile(page, "tinsel-a").click();
  await expectSaved(page);
  expect(await readWornItems(page)).toEqual(["tinsel-a"]);

  // Back on metal, the metal outfit is still there.
  await seat(bradPage, robId, metalTeam);
  await page.goto("/me");
  await expect(page.getByTestId("your-bird-summary")).toHaveText(
    "Battle vest, leather sleeve, lava tips, combat boots and Flying V."
  );
  await page.getByTestId("your-bird-card").scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, "wardrobe-me-card-390x844.png") });
  await page.goto("/me/wardrobe");
  expect(await readWornItems(page)).toEqual(["battle-vest-a", "combat-boots-a", "flying-v-b", "lava-tips-a", "leather-sleeve-a"]);

  // Stripping the bird bare: None on every filled slot.
  for (const slot of ["top", "sleeve", "tail", "boots", "prop"]) {
    await openTab(page, slot);
    await tile(page, "none").click();
  }

  await expectSaved(page);
  await page.reload();
  expect(await readWornItems(page)).toEqual([]);
  await expect(page.locator('[data-testid="wardrobe-tab"][data-filled="true"]')).toHaveCount(0);

  // What the pull reads: every genre Rob dressed, the stripped one as {} — and that undresses the
  // bird Brad had dressed by hand in the pack.
  const exported = (await bradPage.evaluate(async () => (await fetch("/api/admin/export")).json())) as AdminGuestExport[];
  const rob = exported.find((guest) => guest.displayName === "Rob");
  expect(rob?.outfits).toEqual({ metal: {}, disco: { tail: { item: "tinsel-a", style: "white" } } });

  const pull = planPull({
    playersFile: { players: [{ name: "Rob", team: metalTeam, outfits: { metal: { top: { item: "battle-vest-b" } } } }] },
    manifest: { generated: {} },
    guests: exported,
    headFileExists: () => false,
    now: new Date()
  });
  expect(pull.players.players.find((player) => player.name === "Rob")?.outfits).toEqual(rob?.outfits);
  expect(pull.outfitChanges).toEqual([{ name: "Rob", from: ["metal"], to: ["disco"] }]);

  expect(errors).toEqual([]);
  await brad.close();
});
