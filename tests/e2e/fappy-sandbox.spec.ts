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

test("fappy sandbox flies a leg, crashes it, and passes the tablet on both previews", async ({
  page
}) => {
  const socketRequests = collectSocketRequests(page);

  await page.goto("/dev/minigame/fappy");

  await expect(page.getByRole("heading", { name: "Minigame Dev Sandbox" })).toBeVisible();

  // Both previews draw the same course from the live fixture: two legs of three gates.
  await expect(page.locator("[data-fappy-scene]")).toHaveCount(2);
  await expect(page.locator("[data-fappy-gate]")).toHaveCount(6);
  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
  await expect(page.getByText("Alex is up — tap to launch")).toBeVisible();

  const passButton = page.getByRole("button", { name: /Pass the tablet/ });

  await expect(passButton).toBeDisabled();

  // One tap launches the leg; the display mirrors it from the flap log.
  await page.locator("[data-fappy-arena]").click();

  await expect(page.getByText("Alex is flying")).toBeVisible();

  // Nobody flaps again, so the bird comes down in the sand: the local sim
  // reports the end, the real reducer re-runs the log and scores nothing.
  await expect(page.locator("[data-fappy-outcome='crashed']")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("[data-fappy-result='crashed']")).toBeVisible({ timeout: 8000 });
  await expect(passButton).toBeEnabled();

  await passButton.click();

  await expect(page.getByText("Leg 2 of 2")).toHaveCount(2);
  await expect(page.getByText("Morgan is up — tap to launch")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish the relay" })).toBeDisabled();

  expect(socketRequests).toHaveLength(0);
});

test("skipping consumes a leg and the sandbox reset restores a fresh relay", async ({
  page
}) => {
  await page.goto("/dev/minigame/fappy");

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.getByText("Leg 2 of 2")).toHaveCount(2);

  await page.getByRole("button", { name: "Skip leg" }).click();

  await expect(page.getByText("Relay over", { exact: false })).toHaveCount(2);

  await page.getByRole("button", { name: "Reset", exact: true }).click();

  await expect(page.getByText("Leg 1 of 2")).toHaveCount(2);
});
