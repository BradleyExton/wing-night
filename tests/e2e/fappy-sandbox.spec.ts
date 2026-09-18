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

test("fappy sandbox starts the clock on the first tap and sends a crashed bird back to its perch", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/fappy");

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same course from the live fixture: two legs of three gates,
  // every gate a champ from the floor.
  await expect(page.locator("[data-fappy-scene]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-gate]")).toHaveCount(6);
  await expect(page.locator("[data-fappy-champ]")).toHaveCount(6);
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  await expect(page.getByText("Alex is up — tap to launch")).toBeVisible();
  await expect(page.locator("[data-fappy-clock]").first()).toHaveText(/0:00\.0/);

  // One tap launches the leg and starts the relay clock; the display mirrors it.
  await page.locator("[data-fappy-arena]").click();

  await expect(page.getByText("Alex is flying")).toBeVisible();
  await expect(page.locator("[data-fappy-clock]").first()).not.toHaveText(/0:00\.0/);

  // Nobody flaps again, so the bird comes down: the local sim reports the end,
  // the real reducer re-runs the log, and the same player is back on the
  // start line with a crash on the board and the clock still running.
  await expect(page.locator("[data-fappy-crashes='1']")).toBeVisible({ timeout: 8000 });
  await expect(page.getByText("Alex is back on the perch — go again")).toBeVisible();
  await expect(page.getByText("Back to the start line. Tap to go again.")).toBeVisible();
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);

  expect(socketRequests).toHaveLength(0);
});

test("skipping hands the tablet on, finishing scores by time, and reset restores a fresh relay", async ({
  page
}) => {
  await page.goto("/dev/minigame/fappy");

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.getByText("Leg 2 of 2")).toHaveCount(2);
  await expect(page.locator("[data-fappy-handoff]")).toHaveCount(2);
  // The host banner, the display plaque and the display status line all call it.
  await expect(page.getByText("Hand it to Morgan!")).toHaveCount(3);

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.locator("[data-fappy-finish='finished']")).toBeVisible();
  await expect(page.locator("[data-fappy-result='finished']")).toBeVisible();
  await expect(page.getByText("Relay over", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  await expect(page.locator("[data-fappy-clock]").first()).toHaveText(/0:00\.0/);
});
