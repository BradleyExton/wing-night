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

// Drags the host arena from a point right of the slingshot fork back and
// down past it, the way a finger pulls the band, and releases.
const pullAndRelease = async (page: Page): Promise<void> => {
  const arena = page.locator("[data-joust-aim-arena]");
  const bounds = await arena.boundingBox();

  expect(bounds).not.toBeNull();

  if (bounds === null) {
    return;
  }

  // The fork sits at x=40 of 160, y=46 of 90 in the letterboxed 16:9 scene.
  const scale = Math.min(bounds.width / 160, bounds.height / 90);
  const originX = bounds.x + (bounds.width - 160 * scale) / 2;
  const originY = bounds.y + (bounds.height - 90 * scale) / 2;
  const forkX = originX + 40 * scale;
  const forkY = originY + 46 * scale;

  await page.mouse.move(forkX, forkY);
  await page.mouse.down();
  await page.mouse.move(forkX - 11 * scale, forkY + 6 * scale, { steps: 8 });
  await page.mouse.up();
};

test("joust sandbox fires a shot, replays it on the display and moves to the next", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto(devSandboxPath("joust"));

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same lane from the live fixture content.
  await expect(page.locator("[data-joust-scene]")).toHaveCount(2);
  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
  // The rack IS the room: the sandbox roster is twelve players across four teams, so each scene
  // stands the other nine down the lane and benches the shooting three behind the slingshot —
  // one of whom is stepped up to the band.
  await expect(page.locator("[data-joust-bench]")).toHaveCount(2);
  await expect(page.locator("[data-joust-hen]")).toHaveCount(24);
  await expect(page.locator("[data-joust-shooter-figure]")).toHaveCount(2);
  await expect(page.getByText("9/9 standing")).toBeVisible();
  await expect(page.getByText("9 of 9 still standing")).toBeVisible();
  // Centennial Beach: a dock and a lifeguard tower, each on two legs the integrator owns, and
  // the tower's shelf says what it pays (the dock pays what the sand does, so it carries no tag).
  // Nothing is rubble yet, and there is no last shot to ghost.
  await expect(page.locator("[data-joust-leg]")).toHaveCount(8);
  await expect(page.locator('[data-joust-perch-skin="dock"]')).toHaveCount(2);
  await expect(page.locator('[data-joust-perch-skin="lifeguard-tower"]')).toHaveCount(2);
  await expect(page.locator("[data-joust-perch-points]")).toHaveCount(2);
  await expect(page.locator("[data-joust-prop]")).toHaveCount(6);
  await expect(page.locator("[data-joust-rubble]")).toHaveCount(0);
  await expect(page.locator("[data-joust-ghost]")).toHaveCount(0);

  // Everyone on the team shoots, in roster order, and both surfaces say whose go it is — the TV
  // with what they have loaded, because the fixture carries the sample loadout.
  await expect(page.getByText("Alex is up with The Standard")).toBeVisible();
  await expect(page.getByText("Alex is up", { exact: true })).toBeVisible();

  const nextShotButton = page.getByRole("button", { name: "Next shot" });

  await expect(nextShotButton).toBeDisabled();

  await pullAndRelease(page);

  // The real reducer simulated the shot: the host deck names the outcome
  // and the display replays the track before showing its plaque.
  await expect(page.locator("[data-joust-result]").first()).toBeVisible();
  await expect(nextShotButton).toBeEnabled();
  await expect(page.locator("[data-joust-result]")).toHaveCount(2, { timeout: 8000 });

  await nextShotButton.click();

  await expect(page.getByText("Shot 2 of 3")).toHaveCount(2);
  await expect(page.getByText("Caitlin is up", { exact: true })).toBeVisible();
  await expect(nextShotButton).toBeDisabled();
  // The first shot's arc stays on both lanes for Caitlin to adjust off.
  await expect(page.locator("[data-joust-ghost]")).toHaveCount(2);

  expect(socketRequests).toHaveLength(0);
});

// The shooting team stands behind the post in the order they will shoot, and the line walks: when
// the next shot opens the last shooter walks off to the far end and turns their back on the lane
// while everybody else steps up a spot. The harness reads the bench's own slot and walk seams,
// never the transform (the SCHLONIC convention).
const benchFigure = (page: Page, name: string, slot: number) =>
  page.locator(`[data-joust-bench-slot="${slot}"] [data-joust-hen="${name}"]`);

test("the bench steps up a spot and the last shooter walks off when the next shot opens", async ({
  page
}) => {
  await page.goto(devSandboxPath("joust"));

  // Alex is up; Caitlin is next and stands nearest the post, then Dan. Nobody is on the move.
  await expect(benchFigure(page, "Alex", 0)).toHaveCount(2);
  await expect(benchFigure(page, "Caitlin", 1)).toHaveCount(2);
  await expect(benchFigure(page, "Dan", 2)).toHaveCount(2);
  await expect(page.locator('[data-joust-walking="true"]')).toHaveCount(0);
  await expect(page.locator('[data-joust-bench-slot][data-joust-facing="-1"]')).toHaveCount(0);

  const nextShotButton = page.getByRole("button", { name: "Next shot" });

  await pullAndRelease(page);

  // The shooter stays at the post to watch the replay.
  await expect(nextShotButton).toBeEnabled();
  await expect(benchFigure(page, "Alex", 0)).toHaveCount(2);

  await nextShotButton.click();

  // The line is walking: Caitlin to the post, Dan up a spot, Alex off to the far end...
  await expect(page.locator('[data-joust-walking="true"]')).not.toHaveCount(0);
  await expect(benchFigure(page, "Caitlin", 0)).toHaveCount(2);
  await expect(benchFigure(page, "Dan", 1)).toHaveCount(2);
  await expect(benchFigure(page, "Alex", 3)).toHaveCount(2);
  // ...and parks, with Alex turned away from the lane and the other two still facing it.
  await expect(page.locator('[data-joust-walking="true"]')).toHaveCount(0);
  await expect(page.locator('[data-joust-bench-slot="3"][data-joust-facing="-1"]')).toHaveCount(2);
  await expect(page.locator('[data-joust-bench-slot="0"][data-joust-facing="1"]')).toHaveCount(2);
  await expect(page.locator('[data-joust-bench-slot="1"][data-joust-facing="1"]')).toHaveCount(2);
});

test("a barely drawn band does not spend a shot", async ({ page }) => {
  await page.goto(devSandboxPath("joust"));

  const arena = page.locator("[data-joust-aim-arena]");
  const bounds = await arena.boundingBox();

  expect(bounds).not.toBeNull();

  if (bounds === null) {
    return;
  }

  await page.mouse.move(bounds.x + bounds.width * 0.25, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.25 + 2, bounds.y + bounds.height * 0.5);
  await page.mouse.up();

  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Next shot" })).toBeDisabled();
});

// A lane is picked by the shooting team's slot in the turn order, so the sandbox's team switcher
// is also how a lane gets looked at without a whole game running.
test("switching the shooting team puts the sandbox on that team's lane", async ({ page }) => {
  await page.goto(devSandboxPath("joust"));

  await expect(page.getByText("Lane: Centennial Beach")).toBeVisible();

  await page.getByLabel("Whose turn").selectOption("team-beta");

  await expect(page.getByText("Lane: The Spirit Catcher")).toBeVisible();
  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);

  await page.getByLabel("Whose turn").selectOption("team-gamma");

  await expect(page.getByText("Lane: Allandale Dock")).toBeVisible();
});

// The strategy layer: a kind picked on the tablet is what flies, what the TV draws and what the
// room is told; a rationed kind is spent by firing it and comes back disabled on the next band.
test("picking a kind fires it, draws it on both screens and spends it for the turn", async ({
  page
}) => {
  await page.goto(devSandboxPath("joust"));

  // The loadout rides in the host arena only; the fixture ships four kinds, Standard loaded.
  const loadout = page.locator("[data-joust-loadout]");

  await expect(loadout).toHaveCount(1);
  await expect(loadout.locator("[data-joust-loadout-kind]")).toHaveCount(4);
  await expect(page.locator('[data-joust-shooter-kind="standard"]')).toHaveCount(2);

  const logButton = page.locator('[data-joust-loadout-kind="log"]');

  await expect(logButton).toBeEnabled();
  await logButton.click();

  // The real reducer took the pick: both scenes redraw the band with the Log, and the TV says so.
  await expect(logButton).toHaveAttribute("data-joust-loadout-selected", "true");
  await expect(page.locator('[data-joust-shooter-kind="log"]')).toHaveCount(2);
  await expect(page.locator('[data-joust-shooter-kind="standard"]')).toHaveCount(0);
  await expect(page.getByText("Alex is up with The Log")).toBeVisible();

  await pullAndRelease(page);

  // The replay is drawn as the kind that flew, and the loadout is locked mid-shot.
  await expect(page.locator("[data-joust-result]").first()).toBeVisible();
  await expect(page.locator('[data-joust-shooter-kind="log"]')).toHaveCount(2);
  await expect(logButton).toBeDisabled();
  await expect(page.locator("[data-joust-result]")).toHaveCount(2, { timeout: 8000 });

  await page.getByRole("button", { name: "Next shot" }).click();

  // The next band reloads with the Standard; the Log is spent for the rest of the turn.
  await expect(page.getByText("Shot 2 of 3")).toHaveCount(2);
  await expect(page.locator('[data-joust-shooter-kind="standard"]')).toHaveCount(2);
  await expect(logButton).toHaveAttribute("data-joust-loadout-spent", "true");
  await expect(logButton).toBeDisabled();
  await expect(page.locator('[data-joust-loadout-kind="pencil"]')).toBeEnabled();
  await expect(page.getByText("Caitlin is up with The Standard")).toBeVisible();
  // The ghost of the Log's flight is drawn as the Log's.
  await expect(page.locator('[data-joust-ghost-kind="log"]')).toHaveCount(2);
});

test("the sandbox reset button restores a fresh turn", async ({ page }) => {
  await page.goto(devSandboxPath("joust"));

  await page.getByRole("button", { name: "Skip shot" }).click();

  await expect(page.getByText("Shot 2 of 3")).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
});
