import { expect, test, type Page } from "@playwright/test";

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

  await page.goto("/dev/minigame/joust");

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

  // Everyone on the team shoots, in roster order, and both surfaces say whose go it is.
  await expect(page.getByText("Alex — pull back and let it fly")).toBeVisible();
  await expect(page.getByText("Alex is up")).toBeVisible();

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
  await expect(page.getByText("Caitlin is up")).toBeVisible();
  await expect(nextShotButton).toBeDisabled();

  expect(socketRequests).toHaveLength(0);
});

test("a barely drawn band does not spend a shot", async ({ page }) => {
  await page.goto("/dev/minigame/joust");

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
  await page.goto("/dev/minigame/joust");

  await expect(page.getByText("Lane: Two Towers")).toBeVisible();

  await page.getByLabel("Whose turn").selectOption("team-beta");

  await expect(page.getByText("Lane: The Lookout")).toBeVisible();
  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);

  await page.getByLabel("Whose turn").selectOption("team-gamma");

  await expect(page.getByText("Lane: Front Porch")).toBeVisible();
});

test("the sandbox reset button restores a fresh turn", async ({ page }) => {
  await page.goto("/dev/minigame/joust");

  await page.getByRole("button", { name: "Skip shot" }).click();

  await expect(page.getByText("Shot 2 of 3")).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
});
