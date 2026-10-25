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
// him. Then the same pages on a 390px phone for every genre the stack seeds (metal, disco,
// country and pop, one body each): nothing wider than the screen, no control under a thumb, the
// tabs sticking, every tile's crop leaving the head out, and a Move played on the stage.
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
  // bird Brad had dressed by hand in the pack, genre by genre: the pop look Rob never touched stays.
  const exported = (await bradPage.evaluate(async () => (await fetch("/api/admin/export")).json())) as AdminGuestExport[];
  const rob = exported.find((guest) => guest.displayName === "Rob");
  expect(rob?.outfits).toEqual({ metal: {}, disco: { tail: { item: "tinsel-a", style: "white" } } });

  const pull = planPull({
    playersFile: {
      players: [
        {
          name: "Rob",
          team: metalTeam,
          outfits: { metal: { top: { item: "battle-vest-b" } }, pop: { prop: { item: "star-mic-a" } } }
        }
      ]
    },
    manifest: { generated: {} },
    guests: exported,
    headFileExists: () => false,
    now: new Date()
  });
  expect(pull.players.players.find((player) => player.name === "Rob")?.outfits).toEqual({
    ...rob?.outfits,
    pop: { prop: { item: "star-mic-a" } }
  });
  expect(pull.outfitChanges).toEqual([
    {
      name: "Rob",
      genres: [
        { genre: "disco", from: "none", to: "dressed" },
        { genre: "metal", from: "dressed", to: "bare" }
      ],
      kept: ["pop"]
    }
  ]);

  expect(errors).toEqual([]);
  await brad.close();
});

// What a 390px phone must never show: a page wider than the screen, a control a thumb can't hit
// (under 44px a side), or one hanging off either edge. Read off the page as laid out; a control in
// a row that scrolls sideways on purpose (the Looks) is judged by its row, not its own place.
type PhoneFault = { what: string; fault: string };

const readPhoneFaults = (page: Page): Promise<PhoneFault[]> =>
  page.evaluate(() => {
    const faults: { what: string; fault: string }[] = [];
    const width = document.documentElement.clientWidth;
    const name = (element: Element): string =>
      `${element.tagName.toLowerCase()}[${element.getAttribute("data-testid") ?? ""}${element.getAttribute("data-item") ?? ""}${element.getAttribute("data-slot") ?? ""}${element.getAttribute("data-style") ?? ""}${element.getAttribute("data-look") ?? ""}] ${(element.textContent ?? "").trim().slice(0, 24)}`;

    if (document.documentElement.scrollWidth > width) {
      faults.push({ what: "page", fault: `scrolls sideways: ${document.documentElement.scrollWidth} > ${width}` });
    }

    for (const element of document.querySelectorAll("main a, main button, main [role=tab]")) {
      const box = element.getBoundingClientRect();

      if (box.width === 0 && box.height === 0) {
        continue;
      }

      if (box.width < 44 || box.height < 44) {
        faults.push({ what: name(element), fault: `tap target ${Math.round(box.width)}×${Math.round(box.height)}` });
      }

      const row = element.closest('[data-scrolls="x"]');
      const edges = (row ?? element).getBoundingClientRect();

      if (edges.left < 0 || edges.right > width) {
        faults.push({ what: name(element), fault: `off the screen: ${Math.round(edges.left)}..${Math.round(edges.right)}` });
      }
    }

    // A photo head rises past its bird's box: whatever clips the bird must leave room for it. (A
    // tile's crop is its own business, and checked on its own.)
    for (const head of document.querySelectorAll("main [data-character-head] image")) {
      if (head.closest('[data-testid="wardrobe-tile"]') !== null) {
        continue;
      }

      const box = head.getBoundingClientRect();
      let clip = head.parentElement;

      while (clip !== null && getComputedStyle(clip).overflow === "visible") {
        clip = clip.parentElement;
      }

      const frame = clip?.getBoundingClientRect();

      if (frame !== undefined && box.width > 0 && (box.top < frame.top - 1 || box.right > frame.right + 1 || box.left < frame.left - 1)) {
        faults.push({
          what: `head in ${name(clip as Element)}`,
          fault: `clipped: head ${Math.round(box.left)},${Math.round(box.top)}..${Math.round(box.right)} in ${Math.round(frame.left)},${Math.round(frame.top)}..${Math.round(frame.right)}`
        });
      }
    }

    return faults;
  });

test("every genre's /me card and wardrobe fit a 390px phone: rail, tiles, swatches, Looks, the dice and the stage", async ({
  page,
  browser
}, testInfo) => {
  // Four genres, every tab of each and a save per tap: a long walk, not a slow one.
  test.setTimeout(180_000);
  const links = readSeededLinks();
  const brad = await browser.newContext({ ...testInfo.project.use, viewport: { width: 390, height: 844 } });
  const bradPage = await brad.newPage();
  await signIn(bradPage, links.admin);
  const robId = await findGuestId(bradPage, "Rob");

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page, await mintLinkPath(bradPage, robId));

  const genres: string[] = [];
  const stuckGenres: string[] = [];

  for (const teamName of links.teams) {
    await seat(bradPage, robId, teamName);

    // /me: the bird card, with the bird, the line and the way in.
    await page.goto("/me");
    const birdCard = page.getByTestId("your-bird-card");
    await expect(birdCard.getByRole("link", { name: "Open the wardrobe" })).toBeVisible();
    await expect(page.locator(`[data-testid="team-tile"][data-team-name="${teamName}"]`)).toHaveAttribute("aria-pressed", "true");
    expect.soft(await readPhoneFaults(page), `/me on ${teamName}`).toEqual([]);

    await birdCard.getByRole("link", { name: "Open the wardrobe" }).click();
    await expect(page).toHaveURL(/\/me\/wardrobe$/);
    const stage = page.getByTestId("wardrobe-stage");
    await expect(page.getByTestId("wardrobe-bird")).toBeVisible();
    const genre = (await page.getByTestId("wardrobe-rail").getAttribute("data-genre")) ?? "";
    genres.push(genre);

    // The photo head (the one portal.spec.ts painted, when it ran first) rises past the bird's box
    // on the right: it stays clear of the TV-size pill.
    const headUnderPill = await page.evaluate(() => {
      const head = document.querySelector('[data-testid="wardrobe-bird"] [data-character-head] image')?.getBoundingClientRect();
      const pill = document.querySelector('[data-testid="wardrobe-tv-size"]')?.getBoundingClientRect();

      return head === undefined || pill === undefined
        ? null
        : head.bottom > pill.top && head.top < pill.bottom && head.right > pill.left && head.left < pill.right;
    });
    expect(headUnderPill, `${genre} head and pill`).not.toBe(true);

    // The dice and every Look dress the bird and save.
    await page.getByTestId("wardrobe-dress-me").click();
    await expectSaved(page);
    for (const look of await page.getByTestId("wardrobe-look").all()) {
      await look.click();
      await expect(look).toHaveAttribute("aria-pressed", "true");
      await expectSaved(page);
    }

    expect.soft(await readPhoneFaults(page), `/me/wardrobe on ${teamName}`).toEqual([]);
    await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, `wardrobe-${genre}-390x844.png`), fullPage: true });

    // Every tab: its tiles are the bird cropped to the slot on this body, the head left out of every
    // crop and kept whole on the Stage and the Move; and an item with styles shows its swatches.
    const longestSlot = { slot: "", tiles: 0 };

    for (const tab of await page.getByTestId("wardrobe-tab").all()) {
      const slot = (await tab.getAttribute("data-slot")) ?? "";
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const tiles = page.locator('[data-testid="wardrobe-tile"]:not([data-item="none"])');
      const tileCount = await tiles.count();
      expect(tileCount, `${genre} ${slot} has tiles`).toBeGreaterThan(0);

      if (tileCount > longestSlot.tiles) {
        Object.assign(longestSlot, { slot, tiles: tileCount });
      }

      const heads = tiles.locator("[data-character-head]");
      const shownHeads = await heads.evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().width > 0).length);
      expect(shownHeads, `${genre} ${slot} tiles showing a head`).toBe(slot === "stage" || slot === "move" ? await heads.count() : 0);

      const styled = page.locator('[data-testid="wardrobe-tile"][data-styles="many"]').first();

      if ((await styled.count()) > 0) {
        await styled.click();
        await expectSaved(page);
        await expect(page.getByTestId("wardrobe-style").first()).toBeVisible();
      }

      expect.soft(await readPhoneFaults(page), `${genre} ${slot} tab`).toEqual([]);

      if (slot === "prop" || slot === "tail") {
        await page.getByTestId("wardrobe-grid").scrollIntoViewIfNeeded();
        await page.screenshot({ path: resolveScreenshotPath(testInfo.outputDir, `wardrobe-${genre}-${slot}-390x844.png`) });
      }
    }

    // The tabs stick to the top of the screen while the grid scrolls under them: on the longest
    // grid, scrolled until the rail's head is off the screen, the tabs are not. A rail too short
    // to scroll that far never needs them to.
    await page.locator(`[data-testid="wardrobe-tab"][data-slot="${longestSlot.slot}"]`).click();
    await page.evaluate(() => {
      const rail = document.querySelector('[data-testid="wardrobe-rail"]');
      window.scrollTo(0, window.scrollY + (rail?.getBoundingClientRect().top ?? 0) + 60);
    });

    if (((await page.getByTestId("wardrobe-rail").boundingBox())?.y ?? 0) < 0) {
      expect(Math.round((await page.getByRole("tablist").boundingBox())?.y ?? -1), `${genre} tabs stick`).toBe(0);
      stuckGenres.push(genre);
    }

    // A Move tapped on the stage plays, on the page's beat, and the bird goes back to its idle.
    await page.locator('[data-testid="wardrobe-tab"][data-slot="move"]').click();
    const firstMove = page.locator('[data-testid="wardrobe-tile"]:not([data-item="none"])').first();
    const moveId = (await firstMove.getAttribute("data-item")) ?? "";
    await firstMove.click();
    await expectSaved(page);
    await stage.scrollIntoViewIfNeeded();
    await page.getByTestId("wardrobe-bird").click();
    await expect(page.getByTestId("wardrobe-bird")).toHaveAttribute("data-playing-move", moveId);
    await expect(page.getByTestId("wardrobe-bird")).not.toHaveAttribute("data-playing-move", moveId, { timeout: 5_000 });

    // /me again, dressed: the card at 390, for the eye.
    await page.goto("/me");
    await page.getByTestId("your-bird-card").scrollIntoViewIfNeeded();
    expect.soft(await readPhoneFaults(page), `/me dressed on ${teamName}`).toEqual([]);
    await page.getByTestId("your-bird-card").screenshot({ path: resolveScreenshotPath(testInfo.outputDir, `me-card-${genre}-390.png`) });
  }

  // Every genre the wardrobe draws a body for: the three silhouettes and pop's stock bird.
  expect([...genres].sort()).toEqual(["country", "disco", "metal", "pop"]);
  expect(stuckGenres.length, "a rail long enough to need its tabs to stick").toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await brad.close();
});
