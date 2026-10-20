import { expect, test } from "@playwright/test";

import { ensureSetupPhase } from "./hostShell";

// The wardrobe's spine, end to end: a bird dressed by hand in players.json is
// dressed on the TV. The sample pack (which the e2e root is seeded from) dresses
// Alex of Molten Metal in one item per slot (found by that outfit, since the
// config wizard spec renames him earlier in the run), and these specs read the cast's
// `data-outfit-*` markers rather than its drawing, so restyling an item never
// moves them.
const ALEX_KIT = {
  top: "battle-vest-a",
  sleeve: "flame-sleeve-a",
  tail: "chain-loop-b",
  boots: "combat-boots-a"
} as const;

test("does dress a hand-dressed bird in the lobby parade, kit and showpieces both", async ({ browser }) => {
  // Reduced motion parks the first pair on the floor, and Molten Metal is in it.
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await ensureSetupPhase(hostPage);
  await displayPage.goto("/display");

  const alex = displayPage.locator("[data-cast-parade] [data-cast-member]", {
    has: displayPage.locator('[data-outfit-item="battle-vest-a"]')
  });

  await expect(alex).toHaveCount(1);

  for (const [slot, item] of Object.entries(ALEX_KIT)) {
    await expect(alex.locator(`[data-outfit-slot="${slot}"]`).first()).toHaveAttribute("data-outfit-item", item);
  }

  // Boots on both legs; the parade is a showpiece surface, so the Prop is in
  // the wing and the Stage lies on the floor in the shadow pool's place.
  await expect(alex.locator('[data-outfit-slot="boots"]')).toHaveCount(2);
  await expect(alex.locator('[data-outfit-slot="prop"]')).toHaveAttribute("data-outfit-item", "flying-v-a");
  await expect(alex.locator('[data-outfit-slot="prop"]')).toHaveAttribute("data-outfit-style", "white");
  await expect(alex.locator('[data-character-stage] [data-outfit-slot="stage"]')).toHaveAttribute(
    "data-outfit-item",
    "lava-disc-a"
  );

  // Nobody else in the sample pack is dressed.
  await expect(displayPage.locator("[data-cast-parade] [data-outfit-slot]")).toHaveCount(
    await alex.locator("[data-outfit-slot]").count()
  );

  await context.close();
});

test("does dress the same bird in a game with the kit and never a showpiece", async ({ page }) => {
  // The sandbox seeded from the live pack (no `?seed=fixture`): the room is the
  // sample roster, so every player stands in JOUST's lane or on its bench.
  await page.goto("/dev/minigame/joust");

  await expect(page.getByText("Seeded from the live content pack.")).toBeVisible();

  // Found by what it wears, not its name: the config wizard spec renames the
  // sample roster's first player earlier in the run (and keeps the outfit).
  const alex = page.locator("[data-joust-scene] [data-joust-hen]", {
    has: page.locator('[data-outfit-item="battle-vest-a"]')
  }).first();

  await expect(alex).toBeVisible();

  for (const [slot, item] of Object.entries(ALEX_KIT)) {
    await expect(alex.locator(`[data-outfit-slot="${slot}"]`).first()).toHaveAttribute("data-outfit-item", item);
  }

  await expect(page.locator('[data-joust-scene] [data-outfit-slot="prop"]')).toHaveCount(0);
  await expect(page.locator('[data-joust-scene] [data-outfit-slot="stage"]')).toHaveCount(0);
});
