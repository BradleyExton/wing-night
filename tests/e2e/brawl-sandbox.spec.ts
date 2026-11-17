import { expect, test, type Locator, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

// Streets of Barrie in the dev sandbox, while its screens are INTERIM (docs/minigames/
// brawl-crew-spec.md §0.8 step 7 rewrites this against the real ones). The sandbox has no phones,
// so the block is the tablet's own: one hen, played from the two thumbs laid over the street. What
// is pinned here is the pipeline — the reducer keeps the clock, the page's own pulse steps the
// fight, and both screens draw the same frame — not the art.

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

const hostScene = (page: Page): Locator => page.locator("[data-brawl-street-mode] [data-brawl-scene]");
const displayScene = (page: Page): Locator => page.locator("[data-brawl-display-arena] [data-brawl-scene]");
const startButton = (page: Page): Locator => page.locator("[data-brawl-start]");

const readNumber = async (locator: Locator, attribute: string): Promise<number> => {
  return Number((await locator.getAttribute(attribute)) ?? "NaN");
};

const openStreet = async (page: Page): Promise<void> => {
  await page.goto(devSandboxPath("brawl"));
  await expect(hostScene(page)).toHaveCount(1);
  await expect(displayScene(page)).toHaveCount(1);
};

// A thumb on the tablet's own pad, as pointer events on the pad itself: `at` is a fraction of its
// box, and a `to` drags it there before the thumb stays down.
const thumbDown = (page: Page, pointerId: number, at: [number, number], to?: [number, number]): Promise<void> => {
  return page.evaluate(
    ({ pointerId: id, at: from, to: target }) => {
      const pad = document.querySelector("[data-brawl-pad]");

      if (!pad) {
        throw new Error("no pad over the street");
      }

      const box = pad.getBoundingClientRect();
      const init = (point: [number, number]): PointerEventInit => ({
        bubbles: true,
        cancelable: true,
        pointerId: id,
        isPrimary: id === 1,
        pointerType: "touch",
        clientX: box.left + box.width * point[0],
        clientY: box.top + box.height * point[1]
      });

      pad.dispatchEvent(new PointerEvent("pointerdown", init(from)));

      if (target) {
        pad.dispatchEvent(new PointerEvent("pointermove", init(target)));
      }
    },
    { pointerId, at, to }
  );
};

test("brawl sandbox puts the empty street on both screens and offers to play it on the tablet", async ({ page }) => {
  const socketRequests = collectSocketRequests(page);

  await openStreet(page);

  await expect(startButton(page)).toHaveText(/play it on this tablet/i);
  await expect(page.locator("[data-brawl-street-mode]")).toHaveAttribute("data-brawl-street-mode", "monitor");
  await expect(hostScene(page).locator("[data-brawl-hen]")).toHaveCount(0);
  await expect(page.locator("[data-brawl-status]")).toHaveText(/step out on your phone/i);
  expect(socketRequests).toEqual([]);
});

test("brawl sandbox steps the fight on the page's own clock and draws the same frame on both screens", async ({ page }) => {
  await openStreet(page);
  await startButton(page).click();

  await expect(page.locator("[data-brawl-street-mode]")).toHaveAttribute("data-brawl-street-mode", "pad");
  await expect(hostScene(page).locator("[data-brawl-hen]")).toHaveCount(1);
  await expect(displayScene(page).locator("[data-brawl-hen]")).toHaveCount(1);

  // Nobody touches anything: the fight is still stepped, by the pulse the sandbox fires as the
  // server would, and both screens keep up with it.
  await expect.poll(() => readNumber(displayScene(page), "data-brawl-tick"), { timeout: 10_000 }).toBeGreaterThan(120);
  await expect.poll(() => readNumber(hostScene(page), "data-brawl-tick")).toBeGreaterThan(120);
});

test("brawl sandbox walks the tablet's hen across and down the street with the left thumb", async ({ page }) => {
  await openStreet(page);
  await startButton(page).click();

  const hen = hostScene(page).locator('[data-brawl-hen="0"]');
  const startX = await readNumber(hen, "data-brawl-x");
  const startZ = await readNumber(hen, "data-brawl-z");

  // Down and to the right: the stick's south-east.
  await thumbDown(page, 1, [0.2, 0.5], [0.3, 0.68]);

  await expect.poll(() => readNumber(hen, "data-brawl-x"), { timeout: 10_000 }).toBeGreaterThan(startX + 8);
  await expect.poll(() => readNumber(hen, "data-brawl-z")).toBeGreaterThan(startZ + 4);

  // The wall draws her where the tablet does.
  const wallHen = displayScene(page).locator('[data-brawl-hen="0"]');

  await expect
    .poll(async () => Math.abs((await readNumber(wallHen, "data-brawl-x")) - (await readNumber(hen, "data-brawl-x"))))
    .toBeLessThan(4);
});

test("brawl sandbox banks a goose when the tablet's hen holds her beak out", async ({ page }) => {
  test.setTimeout(90_000);

  await openStreet(page);
  await startButton(page).click();
  // The right thumb, down and left down: the sim repeats a held peck by itself.
  await thumbDown(page, 2, [0.8, 0.5]);

  await expect.poll(() => readNumber(displayScene(page), "data-brawl-banked"), { timeout: 60_000 }).toBeGreaterThan(0);
});

test("brawl sandbox skips a block and puts the turn back on block one from the tablet", async ({ page }) => {
  await openStreet(page);
  await startButton(page).click();
  await expect(page.locator("[data-brawl-street-mode]")).toHaveAttribute("data-brawl-street-mode", "pad");

  await page.getByRole("button", { name: /skip block/i }).click();
  await expect(page.getByText("Block 2 of 2").first()).toBeVisible();
  await expect(startButton(page)).toBeVisible();

  await page.getByRole("button", { name: /reset turn/i }).click();
  await expect(page.getByText("Block 1 of 2").first()).toBeVisible();
  await expect(hostScene(page).locator("[data-brawl-hen]")).toHaveCount(0);
});
