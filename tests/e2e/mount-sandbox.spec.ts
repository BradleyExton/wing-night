import { expect, test, type Locator, type Page } from "@playwright/test";
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

// The sandbox renders both surfaces: the tablet's close-up under the host preview, the room's
// whole-pile view on the display preview. Every read below is scoped to one of them.
const HOST_SCENE = '[data-mount-scene="host"]';
const DISPLAY_SCENE = '[data-mount-scene="display"]';

// The rules the sandbox's manifest plays by (spec §0.9): a 30 s climb at 60 Hz, three more seconds
// on the clock for every hen already on the pile.
const CLIMB_SECONDS = 30;
const SECONDS_PER_HEN = 3;
const TICK_HZ = 60;
const FRESH_CLOCK = CLIMB_SECONDS * TICK_HZ;

// The display replays a climb about 7.6 s behind the tablet, plus a 2 s beat.
const MIRROR_TIMEOUT = 20_000;

type Limb = "footLeft" | "footRight" | "wing" | "beak";

const openSandbox = async (page: Page): Promise<void> => {
  await page.goto(devSandboxPath("mount"));
  await expect(page.locator(HOST_SCENE)).toHaveCount(1);
  await expect(page.locator(DISPLAY_SCENE)).toHaveCount(1);
};

// The counter on the tablet and the marquee on the wall both carry the climb's clock.
const hostClock = (page: Page): Locator => page.locator("[data-mount-clock]:not([data-neon-marquee] *)");
const displayClock = (page: Page): Locator => page.locator("[data-neon-marquee] [data-mount-clock]");

const readCameraHeight = async (scene: Locator): Promise<number> => {
  const camera = (await scene.getAttribute("data-mount-camera")) ?? "";
  const [, , , height] = camera.split(" ").map(Number);

  return height ?? Number.NaN;
};

const readCameraTop = async (scene: Locator): Promise<number> => {
  const camera = (await scene.getAttribute("data-mount-camera")) ?? "";
  const [, top] = camera.split(" ").map(Number);

  return top ?? Number.NaN;
};

// Once a climb ends the tablet holds its last frame for a beat (a skip's is 1.6 s) and draws the
// pile from far back; the next hen is only stood at the start, and the arena only armed, when
// that hold is over, and the tablet is back on its 150-unit close-up.
const waitForCloseUp = async (page: Page): Promise<void> => {
  await expect.poll(() => readCameraHeight(page.locator(HOST_SCENE))).toBe(150);
};

// A limb handle's tip as a screen point, through the scene's own svg (so the camera, however it is
// framed and whatever box it is in, is already applied), and any world point on the same screen.
const handleScreenPoint = (page: Page, limb: Limb): Promise<{ x: number; y: number }> => {
  return page.evaluate((name) => {
    const svg = document.querySelector('[data-mount-scene="host"] svg');
    const handle = document.querySelector(`[data-mount-scene="host"] [data-mount-limb="${name}"]`);
    const matrix = svg instanceof SVGSVGElement ? svg.getScreenCTM() : null;
    const translate = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(handle?.getAttribute("transform") ?? "");

    if (matrix === null || translate === null || !(svg instanceof SVGSVGElement)) {
      throw new Error(`no handle for ${name}`);
    }

    const point = svg.createSVGPoint();

    point.x = Number(translate[1]);
    point.y = Number(translate[2]);

    const onScreen = point.matrixTransform(matrix);

    return { x: onScreen.x, y: onScreen.y };
  }, limb);
};

const worldToScreen = (page: Page, world: { x: number; y: number }): Promise<{ x: number; y: number }> => {
  return page.evaluate((target) => {
    const svg = document.querySelector('[data-mount-scene="host"] svg');
    const matrix = svg instanceof SVGSVGElement ? svg.getScreenCTM() : null;

    if (matrix === null || !(svg instanceof SVGSVGElement)) {
      throw new Error("no host svg");
    }

    const point = svg.createSVGPoint();

    point.x = target.x;
    point.y = target.y;

    const onScreen = point.matrixTransform(matrix);

    return { x: onScreen.x, y: onScreen.y };
  }, world);
};

// A limb's state flickers (a lifted foot is `seeking` only until the sim finds a hold), so a poll
// can miss it. This records every state the handle takes, from the page, until read.
type StateLog = { [key: string]: string[] };

const watchLimbStates = (page: Page): Promise<void> => {
  return page.evaluate(() => {
    const logs: StateLog = {};

    (window as unknown as { __mountStates: StateLog }).__mountStates = logs;

    for (const scene of ["host", "display"]) {
      for (const handle of document.querySelectorAll(`[data-mount-scene="${scene}"] [data-mount-limb]`)) {
        const key = `${scene}:${handle.getAttribute("data-mount-limb")}`;

        logs[key] = [handle.getAttribute("data-mount-limb-state") ?? ""];

        new MutationObserver(() => {
          const state = handle.getAttribute("data-mount-limb-state") ?? "";
          const seen = logs[key] ?? [];

          if (seen[seen.length - 1] !== state) {
            seen.push(state);
          }

          logs[key] = seen;
        }).observe(handle, { attributes: true, attributeFilter: ["data-mount-limb-state"] });
      }
    }
  });
};

const readLimbStates = (page: Page, scene: "host" | "display", limb: Limb): Promise<string[]> => {
  return page.evaluate(
    ([sceneName, limbName]) => {
      return (window as unknown as { __mountStates: StateLog }).__mountStates[`${sceneName}:${limbName}`] ?? [];
    },
    [scene, limb] as const
  );
};

// A finger on a limb: lands on its handle, so the arena takes the limb under it.
const pressLimb = async (page: Page, limb: Limb): Promise<void> => {
  const from = await handleScreenPoint(page, limb);

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
};

const dragTo = async (page: Page, world: { x: number; y: number }): Promise<void> => {
  const to = await worldToScreen(page, world);

  await page.mouse.move(to.x, to.y, { steps: 12 });
};

test("mount sandbox draws the climb on both screens: the bare goose holds the line, nobody has climbed, climb 1 of 3 is ready", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await openSandbox(page);

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();
  await expect(page.locator("[data-mount-scene]")).toHaveCount(2);

  for (const scene of [page.locator(HOST_SCENE), page.locator(DISPLAY_SCENE)]) {
    await expect(scene).toHaveAttribute("data-mount-pile-count", "0");
    await expect(scene).toHaveAttribute("data-mount-line-holder", "goose");
    await expect(scene.locator("[data-mount-limb]")).toHaveCount(4);
    await expect(scene.locator("[data-mount-pile-hen]")).toHaveCount(0);
  }

  await expect(page.getByText("Climb 1 of 3").first()).toBeVisible();
  await expect(page.locator("[data-mount-hint]")).toBeVisible();
  await expect(page.locator("[data-mount-hint]")).toContainText("touch a limb");

  // Nobody has touched a limb: the clock is whole on both surfaces.
  await expect(hostClock(page)).toHaveAttribute("data-mount-clock", `${FRESH_CLOCK}`);
  await expect(displayClock(page)).toHaveAttribute("data-mount-clock", `${FRESH_CLOCK}`);

  expect(socketRequests).toHaveLength(0);
});

test("dragging a limb onto a surface grabs it on the tablet, then on the wall, and the first touch starts the clock", async ({
  page
}) => {
  await openSandbox(page);
  await watchLimbStates(page);

  const hostBeak = page.locator(`${HOST_SCENE} [data-mount-limb="beak"]`);
  const displayBeak = page.locator(`${DISPLAY_SCENE} [data-mount-limb="beak"]`);

  await expect(hostBeak).toHaveAttribute("data-mount-limb-state", "limp");
  await expect(displayBeak).toHaveAttribute("data-mount-limb-state", "limp");

  // The beak's handle goes under the finger...
  await pressLimb(page, "beak");
  await expect(hostBeak).toHaveAttribute("data-mount-limb-state", "held");

  // ...and the finger takes it onto the plinth's top, a hand's width in from its left edge, and lets go.
  await dragTo(page, { x: -50, y: -66 });
  await page.mouse.up();

  await expect.poll(() => readLimbStates(page, "host", "beak")).toContain("grabbed");
  expect(await readLimbStates(page, "host", "beak")).toEqual(expect.arrayContaining(["limp", "held", "grabbed"]));

  // The wall follows, a mirror delay behind.
  await expect
    .poll(() => readLimbStates(page, "display", "beak"), { timeout: MIRROR_TIMEOUT })
    .toContain("grabbed");

  // The first touch started the clock: both surfaces are below a whole climb.
  await expect
    .poll(async () => Number(await hostClock(page).getAttribute("data-mount-clock")))
    .toBeLessThan(FRESH_CLOCK);
  await expect
    .poll(async () => Number(await displayClock(page).getAttribute("data-mount-clock")), { timeout: MIRROR_TIMEOUT })
    .toBeLessThan(FRESH_CLOCK);

  // Still the same climb: a grab is not a mount.
  await expect(page.locator(HOST_SCENE)).toHaveAttribute("data-mount-pile-count", "0");
});

test("a grabbed foot lifted off the floor is held under the finger, then seeks a hold when let go", async ({ page }) => {
  await openSandbox(page);
  await watchLimbStates(page);

  const hostFoot = page.locator(`${HOST_SCENE} [data-mount-limb="footLeft"]`);
  const displayFoot = page.locator(`${DISPLAY_SCENE} [data-mount-limb="footLeft"]`);

  // The hen starts standing: her feet are on the floor already.
  await expect(hostFoot).toHaveAttribute("data-mount-limb-state", "grabbed");
  await expect(displayFoot).toHaveAttribute("data-mount-limb-state", "grabbed");

  await pressLimb(page, "footLeft");
  await expect(hostFoot).toHaveAttribute("data-mount-limb-state", "held");

  // Up into the air, well clear of the floor and the plinth, and let go.
  await dragTo(page, { x: -128, y: -40 });
  await page.mouse.up();

  const history = (): Promise<string[]> => readLimbStates(page, "host", "footLeft");

  await expect.poll(history).toContain("seeking");
  expect(await history()).toEqual(expect.arrayContaining(["grabbed", "held", "seeking"]));
  expect((await history()).indexOf("held")).toBeLessThan((await history()).indexOf("seeking"));

  // The wall sees her take the foot off the floor too.
  await expect
    .poll(async () => (await readLimbStates(page, "display", "footLeft")).includes("seeking"), {
      timeout: MIRROR_TIMEOUT
    })
    .toBe(true);
});

test("the goose bot mounts the bare goose: player 1 takes the line, the pile holds one hen, on both screens", async ({
  page
}) => {
  await openSandbox(page);

  await page.locator('[data-sandbox-dev-action="mount-goose-bot"]').click();

  const host = page.locator(HOST_SCENE);
  const display = page.locator(DISPLAY_SCENE);

  await expect(host).toHaveAttribute("data-mount-line-holder", "player-1", { timeout: MIRROR_TIMEOUT });
  await expect(host).toHaveAttribute("data-mount-pile-count", "1");

  // The wall replays the same climb behind the tablet and reaches the same pile.
  await expect(display).toHaveAttribute("data-mount-line-holder", "player-1", { timeout: MIRROR_TIMEOUT });
  await expect(display).toHaveAttribute("data-mount-pile-count", "1", { timeout: MIRROR_TIMEOUT });

  for (const scene of [host, display]) {
    await expect(scene.locator("[data-mount-pile-hen]")).toHaveCount(1);
    await expect(scene.locator("[data-mount-pile-hen]")).toHaveAttribute("data-mount-player-id", "player-1");
  }
});

test("skipping a climb leaves the pile where it was and moves the turn on to the next climb", async ({ page }) => {
  await openSandbox(page);

  const skip = page.getByRole("button", { name: "Skip climb" });

  await skip.click();
  await expect(page.getByText("Climb 2 of 3").first()).toBeVisible();

  await skip.click();
  await expect(page.getByText("Climb 3 of 3").first()).toBeVisible();

  for (const scene of [page.locator(HOST_SCENE), page.locator(DISPLAY_SCENE)]) {
    await expect(scene).toHaveAttribute("data-mount-pile-count", "0");
    await expect(scene).toHaveAttribute("data-mount-line-holder", "goose");
  }
});

test("the next team climbs the pile the first team left, from round memory, on a clock three seconds longer", async ({
  page
}) => {
  test.setTimeout(90_000);
  await openSandbox(page);

  await page.locator('[data-sandbox-dev-action="mount-goose-bot"]').click();

  const host = page.locator(HOST_SCENE);
  const display = page.locator(DISPLAY_SCENE);

  await expect(host).toHaveAttribute("data-mount-pile-count", "1", { timeout: MIRROR_TIMEOUT });
  await expect(display).toHaveAttribute("data-mount-pile-count", "1", { timeout: MIRROR_TIMEOUT });

  // The team's turn is over once its three climbs are spent; the other two are skipped.
  const skip = page.getByRole("button", { name: "Skip climb" });

  await expect(page.getByText("Climb 2 of 3").first()).toBeVisible({ timeout: MIRROR_TIMEOUT });
  await skip.click();
  await expect(page.getByText("Climb 3 of 3").first()).toBeVisible();
  await skip.click();

  await page.getByLabel("Whose turn").selectOption({ index: 1 });

  await expect(page.getByText("Climb 1 of 3").first()).toBeVisible();

  for (const scene of [host, display]) {
    await expect(scene).toHaveAttribute("data-mount-pile-count", "1");
    await expect(scene).toHaveAttribute("data-mount-line-holder", "player-1");
    await expect(scene.locator("[data-mount-pile-hen]")).toHaveCount(1);
  }

  // The pile is a hen taller: three more seconds on the new team's clock, whole until it is touched.
  const longer = (CLIMB_SECONDS + SECONDS_PER_HEN) * TICK_HZ;

  await expect(hostClock(page)).toHaveAttribute("data-mount-clock", `${longer}`);
  await expect(displayClock(page)).toHaveAttribute("data-mount-clock", `${longer}`);
});

test("the wall frames the whole pile and the line while the tablet keeps its close-up", async ({ page }) => {
  await openSandbox(page);

  const host = page.locator(HOST_SCENE);
  const display = page.locator(DISPLAY_SCENE);

  // Before anyone climbs, the tablet's close-up is the sim's 150-unit-tall view.
  expect(await readCameraHeight(host)).toBe(150);

  await page.locator('[data-sandbox-dev-action="mount-goose-bot"]').click();
  await expect(display).toHaveAttribute("data-mount-pile-count", "1", { timeout: MIRROR_TIMEOUT });
  await expect(display).toHaveAttribute("data-mount-line-holder", "player-1");

  const highLine = Number(await display.getAttribute("data-mount-high-line"));

  // The wall's window is taller than the tablet's and reaches up past the pile's line (y is up
  // negative, the floor at 0); the tablet's is still the close-up.
  await expect.poll(() => readCameraHeight(display)).toBeGreaterThan(150);
  await expect.poll(() => readCameraTop(display)).toBeLessThanOrEqual(-highLine);
  expect(await readCameraHeight(host)).toBe(150);
});

test("no socket request leaves the mount sandbox, through a grab, a skip and a bot climb", async ({ page }) => {
  const socketRequests = collectSocketRequests(page);

  await openSandbox(page);

  await pressLimb(page, "beak");
  await dragTo(page, { x: -50, y: -66 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Skip climb" }).click();
  await expect(page.getByText("Climb 2 of 3").first()).toBeVisible();
  await waitForCloseUp(page);
  await page.locator('[data-sandbox-dev-action="mount-goose-bot"]').click();
  await expect(page.locator(HOST_SCENE)).toHaveAttribute("data-mount-pile-count", "1", { timeout: MIRROR_TIMEOUT });

  expect(socketRequests).toHaveLength(0);
});
