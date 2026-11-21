import { expect, test, type Browser, type Page } from "@playwright/test";

// Base Borden online (docs/minigames/base-borden-spec.md §0.7 step 6): phones, each its own browser,
// make and join one room on the Worker's Durable Object, sit as birds, start, and run the base two
// at a time. What one phone's thumb does, the other phone sees; a third player sits a stretch out.
//
// Two and three browsers each, and this file runs first on a cold stack, so its first page waits on
// Vite building the game's chunk: a minute and a half, not the default half.
test.describe.configure({ timeout: 90_000 });

const openPhone = async (browser: Browser): Promise<{ page: Page; errors: string[] }> => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));

  return { page, errors };
};

// A thumb on this phone's own pad, as pointer events on the pad: `at` is a fraction of its box.
const thumb = (page: Page, type: "pointerdown" | "pointermove" | "pointerup", pointerId: number, at: [number, number]): Promise<void> =>
  page.evaluate(
    ({ type: eventType, pointerId: id, at: point }) => {
      const pad = document.querySelector("[data-brawl-pad]");

      if (!pad) {
        throw new Error("no pad over the base");
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

const henAttr = async (page: Page, slot: number, name: "x" | "y"): Promise<number> =>
  Number(await page.locator(`[data-borden-scene] [data-borden-hen="${slot}"]`).getAttribute(`data-borden-${name}`));

const makeRoom = async (page: Page): Promise<string> => {
  await page.goto("/base-borden");
  await page.getByRole("button", { name: "Make a room" }).click();
  await expect(page).toHaveURL(/\/base-borden\/[A-Z]{4}$/);

  return page.url();
};

test("two phones make, join and run one Base Borden room, and each sees the other's hen run and jump", async ({ browser }) => {
  const a = await openPhone(browser);
  const b = await openPhone(browser);
  const roomUrl = await makeRoom(a.page);

  await b.page.goto(roomUrl);

  const faces = a.page.locator("[data-teaser-room-face]");
  const firstFace = await faces.nth(0).getAttribute("data-teaser-room-face");
  const secondFace = await faces.nth(1).getAttribute("data-teaser-room-face");

  await a.page.locator(`[data-teaser-room-face="${firstFace}"]`).click();
  await expect(b.page.locator(`[data-teaser-room-face="${firstFace}"]`)).toBeDisabled();
  await b.page.locator(`[data-teaser-room-face="${secondFace}"]`).click();
  await expect(a.page.getByText("2 of 4 at the fence")).toBeVisible();

  await a.page.locator("[data-teaser-room-start]").click();

  for (const phone of [a, b]) {
    await expect(phone.page.locator("[data-teaser-room-phase]")).toHaveAttribute("data-teaser-room-phase", "playing");
    await expect(phone.page.locator("[data-borden-phone]")).toHaveAttribute("data-borden-phone", "up");
    await expect(phone.page.locator("[data-borden-scene]")).toHaveAttribute("data-borden-scene", "fences");
    await expect(phone.page.locator("[data-borden-scene] [data-borden-hen]")).toHaveCount(2);
  }

  // Phone A runs its hen (slot 0) right for a second; phone B's base shows her go.
  const startOnB = await henAttr(b.page, 0, "x");

  await thumb(a.page, "pointerdown", 1, [0.2, 0.6]);
  await thumb(a.page, "pointermove", 1, [0.32, 0.6]);
  await a.page.waitForTimeout(1000);
  await thumb(a.page, "pointerup", 1, [0.32, 0.6]);

  await expect.poll(() => henAttr(b.page, 0, "x"), { timeout: 5000 }).toBeGreaterThan(startOnB + 5);
  await expect.poll(async () => Math.abs((await henAttr(a.page, 0, "x")) - (await henAttr(b.page, 0, "x"))), { timeout: 5000 }).toBeLessThan(3);

  // Phone B jumps (the right half); phone A sees her leave the ground.
  await thumb(b.page, "pointerdown", 2, [0.8, 0.5]);
  await thumb(b.page, "pointerup", 2, [0.8, 0.5]);
  await expect.poll(() => henAttr(a.page, 1, "y"), { timeout: 3000, intervals: [20] }).toBeGreaterThan(3);

  expect(a.errors).toEqual([]);
  expect(b.errors).toEqual([]);
});

test("a third player sits the first stretch out and is told which stretch is hers", async ({ browser }) => {
  const phones = [await openPhone(browser), await openPhone(browser), await openPhone(browser)];
  const [a] = phones;
  const roomUrl = await makeRoom(a!.page);

  for (const [index, phone] of phones.entries()) {
    if (index > 0) {
      await phone.page.goto(roomUrl);
    }

    const face = phone.page.locator("[data-teaser-room-face]:not([disabled])").first();

    await expect(face).toBeEnabled();
    await face.click();
    await expect(phone.page.locator("[data-teaser-room-face][data-mine='true']")).toHaveCount(1);
  }

  await a!.page.locator("[data-teaser-room-start]").click();

  const third = phones[2]!;

  await expect(third.page.locator("[data-borden-phone]")).toHaveAttribute("data-borden-phone", "out");
  await expect(third.page.locator("[data-brawl-pad]")).toHaveCount(0);
  await expect(third.page.getByText("Your pair runs stretch 2. Watch this one.")).toBeVisible();
  await expect(third.page.locator("[data-borden-scene] [data-borden-hen]")).toHaveCount(2);

  for (const phone of phones) {
    expect(phone.errors).toEqual([]);
  }
});
