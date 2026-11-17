import { expect, test, type Locator, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

// Streets of Barrie in the dev sandbox (docs/minigames/brawl-crew-spec.md §0.7, §0.10). The
// sandbox has no phones, so the block is the tablet's own: one hen, played from the two thumbs
// laid over the street. What is pinned here is the pipeline — the reducer keeps the clock, the
// page's own pulse steps the fight, and both screens draw the same frame — and what the wall adds
// to the street: the crew strip, the wave meter, an ending's beat and the turn's results. A crew
// on its own phones is in contestant-phones.spec.ts; pads you can add here are §0.8 step 7.

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

test("brawl sandbox stands the crew on the real street: Dunlop first, then the waterfront, each with its own hazard", async ({ page }) => {
  await openStreet(page);

  for (const scene of [hostScene(page), displayScene(page)]) {
    await expect(scene).toHaveAttribute("data-brawl-setting", "dunlop");
    await expect(scene.locator("[data-brawl-street='dunlop']")).toHaveCount(1);
    await expect(scene.locator("[data-brawl-hazard='railing']")).toHaveCount(1);
    await expect(scene.locator("[data-brawl-exit]")).toHaveCount(1);
  }

  // The wall fills its arena and gives up sky; the tablet shows the whole window.
  await expect(displayScene(page).locator("[data-brawl-window]")).toHaveAttribute("data-brawl-window", "cover");
  await expect(hostScene(page).locator("[data-brawl-window]")).toHaveAttribute("data-brawl-window", "contain");

  await page.getByRole("button", { name: /skip block/i }).click();
  await expect(displayScene(page)).toHaveAttribute("data-brawl-setting", "waterfront");
  await expect(displayScene(page).locator("[data-brawl-hazard='bay']")).toHaveCount(1);
  await expect(hostScene(page)).toHaveAttribute("data-brawl-setting", "waterfront");
});

test("brawl sandbox gives the wall a crew strip and a wave meter, and keeps both off the tablet", async ({ page }) => {
  await openStreet(page);

  // Nobody has stepped out and this sandbox has no phones: the ready beat says whose block it is.
  await expect(page.locator("[data-brawl-ready='tablet']")).toBeVisible();
  await expect(page.locator("[data-brawl-crew-strip]")).toHaveAttribute("data-brawl-crew-strip", "0");

  await startButton(page).click();

  await expect(page.locator("[data-brawl-ready]")).toHaveCount(0);
  await expect(page.locator("[data-brawl-crew-strip]")).toHaveAttribute("data-brawl-crew-strip", "1");
  await expect(page.locator("[data-brawl-crew-chip='0']")).toHaveAttribute("data-state", "up");
  await expect(page.locator("[data-brawl-crew-chip='0']")).toHaveAttribute("data-hearts", "3");

  // Block one's first wave for one hen is three geese: a pip each, by the edge it steps in from.
  const meter = page.locator("[data-brawl-wave-meter]");

  await expect(meter).toHaveCount(1);
  await expect(meter).toHaveAttribute("data-brawl-wave-size", "3");
  await expect(meter.locator("[data-brawl-wave-pip]")).toHaveCount(3);
  await expect(meter.locator("[data-brawl-wave-pip][data-brawl-wave-side]")).toHaveCount(3);
  await expect(page.locator("[data-brawl-street-mode] [data-brawl-wave-meter]")).toHaveCount(0);

  // A goose steps in: its pip stands up, and its drawing is on both screens.
  await expect(meter.locator("[data-brawl-wave-pip][data-state='in']").first()).toBeVisible({ timeout: 15_000 });
  await expect(displayScene(page).locator("[data-brawl-goon]").first()).toBeVisible();
  await expect(hostScene(page).locator("[data-brawl-goon]").first()).toBeVisible();
});

test("brawl sandbox places the fight through the scene's own paint, not a render a frame", async ({ page }) => {
  await openStreet(page);
  await startButton(page).click();

  const figures = displayScene(page).locator("[data-brawl-figures]");

  await expect.poll(() => readNumber(displayScene(page), "data-brawl-tick"), { timeout: 15_000 }).toBeGreaterThan(300);

  // Three hundred ticks of walking geese, and the figure layer has rendered a fraction of that:
  // a goon's walk frame turning over, never a frame of the fight.
  expect(await readNumber(figures, "data-brawl-figure-renders")).toBeLessThan(150);
});

test("brawl sandbox carries a hen who is out of hearts to the bay, then names her on the turn's results", async ({ page }) => {
  test.setTimeout(120_000);

  await openStreet(page);
  await startButton(page).click();
  // She walks into the left edge and stays there, her back to every goose from the right: a held
  // stick is not a pad gone quiet, so she is fought rather than sat out.
  await thumbDown(page, 1, [0.3, 0.5], [0.15, 0.5]);

  const chip = page.locator("[data-brawl-crew-chip='0']");

  // The strip counts her hearts down as the street takes them.
  await expect.poll(() => readNumber(chip, "data-hearts"), { timeout: 60_000 }).toBeLessThan(3);

  // A crew of one going down is the wipe: the bay beat plays on both screens, called on the wall.
  await expect(displayScene(page)).toHaveAttribute("data-brawl-outcome", "wipe", { timeout: 60_000 });
  await expect(chip).toHaveAttribute("data-state", "down");
  await expect(page.locator("[data-brawl-beat-callout='wipe']")).toContainText(/into the bay/i);
  await expect(page.locator("[data-brawl-beat-next]")).toContainText(/the waterfront/i);
  await expect(displayScene(page).locator("[data-brawl-bay-lift]")).toHaveCount(1);
  await expect(displayScene(page)).toHaveAttribute("data-brawl-beat", "done", { timeout: 10_000 });
  await expect(page.locator("[data-brawl-result]")).toHaveCount(0);

  // The last block is forgiven: the turn is over, and the card names who the geese carried.
  await page.getByRole("button", { name: /skip block/i }).click();

  const result = page.locator("[data-brawl-display-arena] [data-brawl-result='finished']");

  await expect(result).toBeVisible();
  await expect(result.locator("[data-brawl-award='carried']")).toContainText(/1 time/i);
  // The tablet's readout carries the same names beside the running totals.
  await expect(page.locator("[data-brawl-awards]")).toHaveCount(2);
});
