import { expect, test, type Browser, type Page } from "@playwright/test";

// Streets of Barrie together online (docs/minigames/base-borden-spec.md §0.7 step 2): two phones,
// each its own browser, make and join one room on the Worker's Durable Object, sit as two birds,
// start, and play one street. What one phone's thumb does, the other phone sees.

const openPhone = async (browser: Browser): Promise<{ page: Page; errors: string[] }> => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));

  return { page, errors };
};

// A thumb on this phone's own pad, as pointer events on the pad: `at` and `to` are fractions of its box.
const thumb = (page: Page, type: "pointerdown" | "pointermove" | "pointerup", pointerId: number, at: [number, number]): Promise<void> =>
  page.evaluate(
    ({ type: eventType, pointerId: id, at: point }) => {
      const pad = document.querySelector("[data-brawl-pad]");

      if (!pad) {
        throw new Error("no pad over the street");
      }

      const box = pad.getBoundingClientRect();

      pad.dispatchEvent(
        new PointerEvent(eventType, {
          bubbles: true,
          cancelable: true,
          pointerId: id,
          isPrimary: id === 1,
          pointerType: "touch",
          clientX: box.left + box.width * point[0],
          clientY: box.top + box.height * point[1]
        })
      );
    },
    { type, pointerId, at }
  );

const henX = async (page: Page, slot: number): Promise<number> =>
  Number(await page.locator(`[data-brawl-scene] [data-brawl-hen="${slot}"]`).getAttribute("data-brawl-x"));

test("two phones make, join and play one room, and each sees the other's hen move", async ({ browser }) => {
  const a = await openPhone(browser);
  const b = await openPhone(browser);

  await a.page.goto("/play");
  await a.page.getByRole("button", { name: "Make a room" }).click();
  await expect(a.page).toHaveURL(/\/play\/[A-Z]{4}$/);

  const roomUrl = a.page.url();

  await b.page.goto(roomUrl);

  for (const phone of [a, b]) {
    await expect(phone.page.locator("[data-teaser-room-phase]")).toHaveAttribute("data-teaser-room-phase", "lobby");
  }

  const faces = a.page.locator("[data-teaser-room-face]");
  const firstFace = await faces.nth(0).getAttribute("data-teaser-room-face");
  const secondFace = await faces.nth(1).getAttribute("data-teaser-room-face");

  await a.page.locator(`[data-teaser-room-face="${firstFace}"]`).click();
  await expect(b.page.locator(`[data-teaser-room-face="${firstFace}"]`)).toBeDisabled();
  await b.page.locator(`[data-teaser-room-face="${secondFace}"]`).click();
  await expect(a.page.getByText("2 of 5 on the street")).toBeVisible();

  await a.page.locator("[data-teaser-room-start]").click();

  for (const phone of [a, b]) {
    await expect(phone.page.locator("[data-teaser-room-phase]")).toHaveAttribute("data-teaser-room-phase", "playing");
    await expect(phone.page.locator("[data-brawl-phone]")).toHaveAttribute("data-brawl-phone", "up");
    await expect(phone.page.locator("[data-brawl-scene] [data-brawl-hen]")).toHaveCount(2);
  }

  // Phone A walks its hen (slot 0) right for a second; phone B's street shows her go.
  const startOnB = await henX(b.page, 0);

  await thumb(a.page, "pointerdown", 1, [0.2, 0.6]);
  await thumb(a.page, "pointermove", 1, [0.32, 0.6]);
  await a.page.waitForTimeout(1000);
  await thumb(a.page, "pointerup", 1, [0.32, 0.6]);

  await expect.poll(() => henX(b.page, 0), { timeout: 5000 }).toBeGreaterThan(startOnB + 5);
  await expect.poll(async () => Math.abs((await henX(a.page, 0)) - (await henX(b.page, 0))), { timeout: 5000 }).toBeLessThan(3);

  expect(a.errors).toEqual([]);
  expect(b.errors).toEqual([]);
});

test("a phone that is not in the game watches it, and cannot take a bird mid-game", async ({ browser }) => {
  const a = await openPhone(browser);
  const watcher = await openPhone(browser);

  await a.page.goto("/play");
  await a.page.getByRole("button", { name: "Make a room" }).click();
  await expect(a.page).toHaveURL(/\/play\/[A-Z]{4}$/);
  await a.page.locator("[data-teaser-room-face]").first().click();
  await a.page.locator("[data-teaser-room-start]").click();
  await expect(a.page.locator("[data-teaser-room-phase]")).toHaveAttribute("data-teaser-room-phase", "playing");

  await watcher.page.goto(a.page.url());
  await expect(watcher.page.locator("[data-brawl-phone]")).toHaveAttribute("data-brawl-phone", "watching");
  await expect(watcher.page.locator("[data-brawl-pad]")).toHaveCount(0);
  await expect(watcher.page.locator("[data-brawl-scene] [data-brawl-hen]")).toHaveCount(1);

  expect(watcher.errors).toEqual([]);
});
