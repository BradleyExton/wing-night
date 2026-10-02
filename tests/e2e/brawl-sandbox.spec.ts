import { expect, test, type Page } from "@playwright/test";
import { devSandboxPath } from "./sandbox";

const collectSocketRequests = (page: Page): string[] => {
  const socketRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/socket.io")) {
      socketRequests.push(request.url());
    }
  });

  return socketRequests;
};

// The sandbox renders both surfaces: the tablet's street and chrome under the host preview, the
// wall's under the NeonMarquee and the display arena. Every read below is scoped to one of them.
const HOST_SCENE = '[data-brawl-scene="host-brawl"]';
const DISPLAY_SCENE = '[data-brawl-display-arena] [data-brawl-scene="display-brawl"]';

const openStreet = async (page: Page): Promise<void> => {
  await page.goto(devSandboxPath("brawl"));
  await expect(page.locator(HOST_SCENE)).toHaveCount(1);
  await expect(page.locator(DISPLAY_SCENE)).toHaveCount(1);
};

// One tap on the peck zone, from the page itself: a peck is a press, and the first one starts the
// block's clock.
const peckOnce = (page: Page): Promise<void> => {
  return page.evaluate(() => {
    const zone = document.querySelector("[data-brawl-peck-zone]");

    if (!zone) {
      throw new Error("no peck zone");
    }

    const rect = zone.getBoundingClientRect();
    const init = {
      bubbles: true,
      cancelable: true,
      pointerId: 9,
      isPrimary: true,
      pointerType: "touch",
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };

    zone.dispatchEvent(new PointerEvent("pointerdown", init));
    zone.dispatchEvent(new PointerEvent("pointerup", init));
  });
};

test("brawl sandbox lays out block 1 on both screens, with the wall's camera wider than the tablet's on both sides", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await openStreet(page);

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  const host = page.locator(HOST_SCENE);
  const wall = page.locator(DISPLAY_SCENE);
  const marquee = page.locator("[data-neon-marquee]");

  // The tablet holds the sim's own 160-wide box; the wall fills its arena around the same street.
  await expect(host).toHaveAttribute("data-brawl-camera", "fixed");
  await expect(wall).toHaveAttribute("data-brawl-camera", "fill");
  await expect(host).toHaveAttribute("data-brawl-wave", "0");
  await expect(host).toHaveAttribute("data-brawl-locked", "true");
  await expect(host.locator("[data-brawl-hen]")).toHaveAttribute("data-brawl-x", "30");

  await expect(page.getByText("Block 1 of 2").first()).toBeVisible();
  await expect(page.locator("[data-brawl-hint]")).toHaveText(
    "Alex is on the line — hold left to walk, pull back to turn, tap right to peck"
  );

  // Hearts at three on both chrome rows: the tablet's counter and the wall's marquee.
  const hearts = page.locator("[data-brawl-hearts]");

  await expect(hearts).toHaveCount(2);

  for (const row of [page.locator("[data-brawl-hearts]:not([data-neon-marquee] *)"), marquee.locator("[data-brawl-hearts]")]) {
    await expect(row).toHaveAttribute("data-brawl-hearts", "3");
    await expect(row.locator('[data-lit="true"]')).toHaveCount(3);
  }

  // The worth down over the whole course: 7 for block 0 and 10 for block 1 on this seed.
  await expect(page.locator("[data-brawl-goons]")).toHaveText(["0 / 17", "0 / 17"]);
  await expect(page.locator("[data-brawl-walk-pad]")).toHaveCount(1);
  await expect(page.locator("[data-brawl-peck-zone]")).toHaveCount(1);

  // The wall's wave meter is on wave one of two, three geese to count down, none of them yet.
  const meter = page.locator("[data-brawl-display-arena] [data-brawl-wave-meter]");

  await expect(meter).toHaveAttribute("data-brawl-wave", "0");
  await expect(meter).toHaveAttribute("data-brawl-wave-clear", "false");
  await expect(meter.locator("[data-brawl-wave-group]")).toHaveCount(2);
  await expect(meter.locator('[data-brawl-wave-group="0"]')).toHaveAttribute("data-current", "true");
  await expect(meter.locator('[data-brawl-wave-group="0"]')).toContainText("Wave 1 of 2");
  await expect(meter.locator('[data-brawl-wave-group="0"] [data-brawl-wave-pip]')).toHaveCount(3);
  await expect(meter.locator('[data-brawl-wave-group="0"] [data-brawl-wave-pip][data-lit="true"]')).toHaveCount(0);

  // The split camera: more street than the tablet's 160, the extra on both sides of it.
  await expect
    .poll(async () => {
      const viewBox = (await wall.locator("svg").first().getAttribute("viewBox")) ?? "";
      const [x, , width] = viewBox.split(" ").map(Number);

      return x < 0 && width > 160;
    })
    .toBe(true);
  await expect(host.locator("svg").first()).toHaveAttribute("viewBox", "0 0 160 90");

  expect(socketRequests).toHaveLength(0);
});

test("a peck flips the hen's beak out, a held walk thumb walks her the way she faces and a pull back turns her, and a held peck keeps pecking", async ({
  page
}) => {
  await openStreet(page);

  const scene = page.locator(HOST_SCENE);
  const hen = page.locator(`${HOST_SCENE} [data-brawl-hen]`);

  // The beak is out a beat after the tap, and only for a few frames: catch it from the page.
  const sawPeck = await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      const henElement = document.querySelector('[data-brawl-scene="host-brawl"] [data-brawl-hen]');
      const zone = document.querySelector("[data-brawl-peck-zone]");

      if (!henElement || !zone) {
        resolve(false);
        return;
      }

      const rect = zone.getBoundingClientRect();
      const init = {
        bubbles: true,
        cancelable: true,
        pointerId: 9,
        isPrimary: true,
        pointerType: "touch",
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      };

      zone.dispatchEvent(new PointerEvent("pointerdown", init));
      zone.dispatchEvent(new PointerEvent("pointerup", init));

      let frames = 0;
      const loop = (): void => {
        frames += 1;

        if (henElement.getAttribute("data-brawl-pecking") === "true") {
          resolve(true);
          return;
        }

        if (frames > 20) {
          resolve(false);
          return;
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  });

  expect(sawPeck).toBe(true);
  // The block is running: the tablet drops its line and the wall says who is brawling.
  await expect(page.locator("[data-brawl-hint]")).toHaveCount(0);
  await expect(page.getByText("Alex is brawling — count the wave down!")).toBeVisible();

  await expect(hen).toHaveAttribute("data-brawl-pecking", "false");
  await expect(hen).toHaveAttribute("data-brawl-facing", "1");

  const startX = Number(await hen.getAttribute("data-brawl-x"));
  const pad = page.locator("[data-brawl-walk-pad]");
  const stick = page.locator("[data-brawl-thumb]");
  const box = await pad.boundingBox();

  expect(box).not.toBeNull();

  if (box === null) {
    return;
  }

  // A real thumb lands in the middle of the pad — no side of anything — and holds: she walks
  // the way she faces, and the stick shows under the thumb.
  const thumbX = box.x + box.width / 2;
  const thumbY = box.y + box.height / 2;

  await page.mouse.move(thumbX, thumbY);
  await page.mouse.down();
  await expect(stick).toHaveAttribute("data-brawl-thumb-held", "true");
  await page.waitForTimeout(600);

  const heldX = Number(await hen.getAttribute("data-brawl-x"));

  expect(heldX - startX).toBeGreaterThan(10);
  await expect(hen).toHaveAttribute("data-brawl-facing", "1");
  await expect(stick).toHaveAttribute("data-brawl-thumb-dir", "right");

  // Still held, the thumb pulls back past the dead band: she turns and walks back.
  await page.mouse.move(thumbX - 50, thumbY, { steps: 5 });
  await expect(hen).toHaveAttribute("data-brawl-facing", "-1");
  await expect(stick).toHaveAttribute("data-brawl-thumb-dir", "left");

  const turnedX = Number(await hen.getAttribute("data-brawl-x"));

  await page.waitForTimeout(500);

  const backX = Number(await hen.getAttribute("data-brawl-x"));

  expect(turnedX - backX).toBeGreaterThan(10);

  await page.mouse.up();
  await expect(stick).toHaveAttribute("data-brawl-thumb-held", "false");

  // Lifted: she stands where she stopped.
  await page.waitForTimeout(150);
  const stoppedX = Number(await hen.getAttribute("data-brawl-x"));

  await page.waitForTimeout(400);
  await expect(hen).toHaveAttribute("data-brawl-x", `${stoppedX}`);

  // A thumb held on the peck zone keeps pecking at the sim's rate: every peck the sim takes moves
  // the scene's peck mark on, and a second of holding takes several.
  const zoneBox = await page.locator("[data-brawl-peck-zone]").boundingBox();

  expect(zoneBox).not.toBeNull();

  if (zoneBox === null) {
    return;
  }

  const peckMarks = new Set<string>();
  const readMark = async (): Promise<void> => {
    peckMarks.add((await scene.getAttribute("data-brawl-peck-until")) ?? "");
  };

  await readMark();
  const before = peckMarks.size;

  await page.mouse.move(zoneBox.x + zoneBox.width / 2, zoneBox.y + zoneBox.height / 2);
  await page.mouse.down();

  const heldFrom = Date.now();

  while (Date.now() - heldFrom < 1000) {
    await readMark();
    await page.waitForTimeout(40);
  }

  await page.mouse.up();

  expect(peckMarks.size - before).toBeGreaterThanOrEqual(3);
});

type FirstSeen = {
  spawnIndex: string;
  side: "left" | "right";
  tvMs: number;
  tabletMs: number;
};

test("the wall sees every first-wave goon before the tablet does, from both sides", async ({ page }) => {
  await openStreet(page);

  // One peck starts the clock; then nobody touches the tablet and the first wave walks in on her.
  // Each frame reads both scenes: a goon is on a screen when its x is inside that screen's window
  // of the street — the tablet's is [cameraX, cameraX + 160], the wall's is its viewBox laid on
  // its own cameraX — and the first frame it is, per screen, is stamped.
  const seen = await page.evaluate(() => {
    return new Promise<FirstSeen[]>((resolve) => {
      const hostScene = document.querySelector('[data-brawl-scene="host-brawl"]');
      const wallScene = document.querySelector('[data-brawl-display-arena] [data-brawl-scene="display-brawl"]');
      const zone = document.querySelector("[data-brawl-peck-zone]");

      if (!hostScene || !wallScene || !zone) {
        resolve([]);
        return;
      }

      const tv = new Map<string, number>();
      const tablet = new Map<string, number>();
      const sides = new Map<string, "left" | "right">();
      const rect = zone.getBoundingClientRect();
      const startedAt = performance.now();

      const tap = {
        bubbles: true,
        cancelable: true,
        pointerId: 9,
        isPrimary: true,
        pointerType: "touch",
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      };

      // A tap, not a hold: a held peck thumb keeps pecking, and this hen is meant to stand idle.
      zone.dispatchEvent(new PointerEvent("pointerdown", tap));
      zone.dispatchEvent(new PointerEvent("pointerup", tap));

      const goonsOn = (scene: Element): { index: string; x: number }[] => {
        return [...scene.querySelectorAll("[data-brawl-goon]")].map((goon) => ({
          index: goon.getAttribute("data-brawl-goon") ?? "",
          x: Number(goon.getAttribute("data-brawl-goon-x"))
        }));
      };

      const loop = (): void => {
        const now = Math.round(performance.now() - startedAt);
        const hostCamera = Number(hostScene.getAttribute("data-brawl-camera-x"));
        const henX = Number(hostScene.querySelector("[data-brawl-hen]")?.getAttribute("data-brawl-x"));
        const wallCamera = Number(wallScene.getAttribute("data-brawl-camera-x"));
        const [viewX, , viewWidth] = (wallScene.querySelector("svg")?.getAttribute("viewBox") ?? "0 0 0 0")
          .split(" ")
          .map(Number);
        const isFirstWave = hostScene.getAttribute("data-brawl-wave") === "0";

        for (const goon of goonsOn(wallScene)) {
          if (!tv.has(goon.index) && goon.x >= wallCamera + viewX && goon.x <= wallCamera + viewX + viewWidth) {
            tv.set(goon.index, now);
          }
        }

        for (const goon of goonsOn(hostScene)) {
          if (!sides.has(goon.index)) {
            sides.set(goon.index, goon.x < henX ? "left" : "right");
          }

          if (!tablet.has(goon.index) && goon.x >= hostCamera && goon.x <= hostCamera + 160) {
            tablet.set(goon.index, now);
          }
        }

        // The first wave is three geese; stop once the tablet has had all of them, or the wave
        // is over, or the hen is.
        if (tablet.size >= 3 || !isFirstWave || now > 20_000) {
          resolve(
            [...sides.keys()].map((index) => ({
              spawnIndex: index,
              side: sides.get(index) ?? "right",
              tvMs: tv.get(index) ?? -1,
              tabletMs: tablet.get(index) ?? -1
            }))
          );
          return;
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  });

  test.info().annotations.push({ type: "lookout", description: JSON.stringify(seen) });

  expect(seen.length).toBeGreaterThanOrEqual(3);
  // Block 0's first wave is geese, drawn as geese on both screens.
  await expect(page.locator(`${HOST_SCENE} [data-brawl-goon] [data-brawl-goon-kind="goose"]`).first()).toBeAttached();
  await expect(page.locator(`${DISPLAY_SCENE} [data-brawl-goon] [data-brawl-goon-kind="goose"]`).first()).toBeAttached();

  // Spec §3: the room is the hen's lookout. Somebody from each side was on the wall a good
  // fifth of a second before the holder's frame had it.
  for (const side of ["left", "right"] as const) {
    const leads = seen
      .filter((goon) => goon.side === side && goon.tvMs >= 0 && goon.tabletMs >= 0)
      .map((goon) => goon.tabletMs - goon.tvMs);

    expect(leads.length, `a ${side} goon seen on both screens`).toBeGreaterThan(0);
    expect(Math.max(...leads), `the wall's lead on a ${side} goon`).toBeGreaterThanOrEqual(200);
  }
});

type BlockRun = {
  /** How long the bot fought before the tablet's handoff callout went up; -1 if it never did. */
  handoffAfterMs: number;
  sawHostGo: boolean;
  /** Each wave the wall's meter said GO on, and whether every pip of it was lit when it did. */
  goes: { wave: string; pips: number; lit: number }[];
};

// Fights block 1 from the page itself: reads the tablet scene's goons and the hen each frame,
// walks toward the nearest goon it can fight (not one still walking in), and pecks once it is in
// reach and facing it. With nothing standing, it walks on through the GO. Resolves at the
// tablet's handoff callout, a bay, or the time limit.
const brawlBlock = (page: Page): Promise<BlockRun> => {
  return page.evaluate(() => {
    return new Promise<BlockRun>((resolve) => {
      const scene = document.querySelector('[data-brawl-scene="host-brawl"]');
      const pad = document.querySelector("[data-brawl-walk-pad]");
      const zone = document.querySelector("[data-brawl-peck-zone]");
      const meter = document.querySelector("[data-brawl-display-arena] [data-brawl-wave-meter]");

      if (!scene || !pad || !zone || !meter) {
        resolve({ handoffAfterMs: -1, sawHostGo: false, goes: [] });
        return;
      }

      const send = (element: Element, type: string, x: number, y: number, pointerId: number): void => {
        element.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId,
            isPrimary: true,
            pointerType: "touch",
            clientX: x,
            clientY: y
          })
        );
      };
      const padRect = pad.getBoundingClientRect();
      const zoneRect = zone.getBoundingClientRect();
      const padY = padRect.top + padRect.height / 2;
      const hen = (): Element | null => scene.querySelector("[data-brawl-hen]");
      // The walk thumb as a player uses it: land anywhere (the pad's middle) and she walks the
      // way she faces; pull back past the dead band to turn. `thumbX` is where the thumb is.
      const PULL_PX = 45;
      let thumbX = padRect.left + padRect.width / 2;
      let dir = 0;
      let frames = 0;
      let lastPeck = -99;
      let sawHostGo = false;
      const goes: BlockRun["goes"] = [];
      const startedAt = performance.now();

      const walkTo = (next: number): void => {
        if (next === dir) {
          return;
        }

        if (next === 0) {
          send(pad, "pointerup", thumbX, padY, 7);
          dir = 0;
          return;
        }

        if (dir === 0) {
          thumbX = padRect.left + padRect.width / 2;
          send(pad, "pointerdown", thumbX, padY, 7);
          dir = Number(hen()?.getAttribute("data-brawl-facing"));
        }

        if (dir !== next) {
          thumbX += next * PULL_PX;
          send(pad, "pointermove", thumbX, padY, 7);
        }

        dir = next;
      };
      const peck = (): void => {
        const x = zoneRect.left + zoneRect.width / 2;
        const y = zoneRect.top + zoneRect.height / 2;

        send(zone, "pointerdown", x, y, 9);
        send(zone, "pointerup", x, y, 9);
      };

      peck();

      const tick = (): void => {
        frames += 1;

        if (scene.querySelector('[data-brawl-go="true"]')) {
          sawHostGo = true;
        }

        if (meter.getAttribute("data-brawl-wave-clear") === "true") {
          const wave = meter.getAttribute("data-brawl-wave") ?? "";

          if (!goes.some((go) => go.wave === wave)) {
            const pips = meter.querySelectorAll(`[data-brawl-wave-group="${wave}"] [data-brawl-wave-pip]`);
            const lit = meter.querySelectorAll(`[data-brawl-wave-group="${wave}"] [data-brawl-wave-pip][data-lit="true"]`);

            goes.push({ wave, pips: pips.length, lit: lit.length });
          }
        }

        const elapsed = performance.now() - startedAt;

        if (document.querySelector('[data-brawl-handoff-callout="host"]')) {
          walkTo(0);
          resolve({ handoffAfterMs: Math.round(elapsed), sawHostGo, goes });
          return;
        }

        if (scene.querySelector('[data-brawl-bay][display="inline"]') || elapsed > 60_000) {
          walkTo(0);
          resolve({ handoffAfterMs: -1, sawHostGo, goes });
          return;
        }

        const henElement = hen();
        const x = Number(henElement?.getAttribute("data-brawl-x"));
        const facing = Number(henElement?.getAttribute("data-brawl-facing"));
        const fightable = [...scene.querySelectorAll("[data-brawl-goon]")]
          .map((goon) => ({
            x: Number(goon.getAttribute("data-brawl-goon-x")),
            state: goon.querySelector("[data-brawl-goon-state]")?.getAttribute("data-brawl-goon-state")
          }))
          .filter((goon) => goon.state !== "ko" && goon.state !== "gone" && goon.state !== "entering");

        if (fightable.length === 0) {
          walkTo(scene.getAttribute("data-brawl-locked") === "true" ? 0 : 1);
        } else {
          const nearest = fightable.reduce((best, goon) => (Math.abs(goon.x - x) < Math.abs(best.x - x) ? goon : best));
          const side = nearest.x >= x ? 1 : -1;

          if (Math.abs(nearest.x - x) > 14 || facing !== side) {
            walkTo(side);
          } else {
            walkTo(0);

            if (frames - lastPeck >= 8) {
              peck();
              lastPeck = frames;
            }
          }
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  });
};

test("a brawler clears block 1, the wall counts each wave down to GO, and the tablet goes to the next player", async ({
  page
}) => {
  test.setTimeout(90_000);
  await openStreet(page);

  const run = await brawlBlock(page);

  expect(run.handoffAfterMs).toBeGreaterThan(0);
  expect(run.sawHostGo).toBe(true);
  // Block 0 is two waves: three geese, then four with a gull. The wall said GO on both, every pip lit.
  expect(run.goes).toEqual([
    { wave: "0", pips: 3, lit: 3 },
    { wave: "1", pips: 4, lit: 4 }
  ]);

  // The cleared beat hands the tablet on, by name, on both screens.
  await expect(page.locator('[data-brawl-handoff-callout="host"]')).toContainText("Caitlin");
  await expect(page.locator('[data-brawl-beat-callout="cleared"]')).toBeVisible();
  await expect(page.locator('[data-brawl-handoff-callout="display"]')).toHaveText("Caitlin");

  await expect(page.getByText("Block 2 of 2").first()).toBeVisible();
  await expect(page.locator(HOST_SCENE)).toHaveAttribute("data-brawl-block", "1", { timeout: 6000 });
  await expect(page.locator("[data-brawl-hint]")).toHaveText(
    "Caitlin is on the line — hold left to walk, pull back to turn, tap right to peck",
    { timeout: 6000 }
  );
});

test("a hen nobody steers is carried into the bay on both screens", async ({ page }) => {
  test.setTimeout(60_000);
  await openStreet(page);

  // Watch both screens from the page: the lowest the tablet's hearts went, and whether each
  // screen ever showed the bay (the tablet's splash, the wall's callout line).
  await page.evaluate(() => {
    const record = { minHearts: 3, hostBay: false, wallBay: false, wallNext: "" };
    const hostHearts = [...document.querySelectorAll("[data-brawl-hearts]")].find(
      (element) => element.closest("[data-neon-marquee]") === null
    );

    (window as unknown as { __brawlBay: typeof record }).__brawlBay = record;

    const loop = (): void => {
      const hearts = Number(hostHearts?.getAttribute("data-brawl-hearts") ?? 3);

      record.minHearts = Math.min(record.minHearts, hearts);

      if (document.querySelector('[data-brawl-scene="host-brawl"] [data-brawl-bay][display="inline"]')) {
        record.hostBay = true;
      }

      if (document.querySelector('[data-brawl-display-arena] [data-brawl-beat-line="bay"]')) {
        record.wallBay = true;
        record.wallNext =
          document.querySelector('[data-brawl-beat-callout="ko"] [data-brawl-handoff-callout="display"]')?.textContent ??
          record.wallNext;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  });

  await peckOnce(page);

  type BayRecord = { minHearts: number; hostBay: boolean; wallBay: boolean; wallNext: string };

  const readBay = (): Promise<BayRecord> => {
    return page.evaluate(() => {
      return (window as unknown as { __brawlBay: BayRecord }).__brawlBay;
    });
  };

  await expect.poll(async () => (await readBay()).minHearts, { timeout: 45_000 }).toBe(0);
  await expect.poll(async () => (await readBay()).hostBay, { timeout: 6000 }).toBe(true);
  await expect.poll(async () => (await readBay()).wallBay, { timeout: 6000 }).toBe(true);
  // Under INTO THE BAY, a size down, the wall still says whose tablet it is now.
  expect((await readBay()).wallNext).toContain("Caitlin");
});
