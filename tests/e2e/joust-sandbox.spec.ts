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

  // Both previews draw the same arena from the live fixture content.
  await expect(page.locator("[data-joust-scene]")).toHaveCount(2);
  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
  await expect(page.getByText("Pull back… and let it fly")).toBeVisible();

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

test("the sandbox reset button restores a fresh turn", async ({ page }) => {
  await page.goto("/dev/minigame/joust");

  await page.getByRole("button", { name: "Skip shot" }).click();

  await expect(page.getByText("Shot 2 of 3")).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Shot 1 of 3")).toHaveCount(2);
});
