import { expect, test } from "@playwright/test";

import {
  displayMinigameTakeover,
  ensureSetupPhase,
  lockTeamsFromSetup
} from "./hostShell";

// Quick Play is the night with the wings taken out: the launcher deals whoever
// is here onto the pack's teams, queues the games, and the room opens on the
// first briefing. This walks the whole seam once — launcher to host shell to
// TV — with the round-1 game the sample pack ships, so the takeover locator
// the sync spec uses still names it.
test("quick play skips the wings: the launcher opens the briefing and the TV follows into play", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);

  await hostPage.getByRole("link", { name: "Quick Play a mini-game" }).click();

  await expect(hostPage).toHaveURL(/\/quickplay$/);
  await expect(hostPage.getByRole("heading", { name: "Just the games." })).toBeVisible();

  const startButton = hostPage.getByRole("button", { name: "Start Quick Play" });
  await expect(startButton).toBeDisabled();

  await hostPage.getByRole("button", { name: "Everyone" }).click();
  await hostPage.getByRole("button", { name: "Queue Schlonic" }).click();

  // The game's rules arrive seeded from the pack and are the host's to change.
  const runsPerTurnField = hostPage.getByLabel("Runs per turn");
  await expect(runsPerTurnField).toHaveValue(/^\d+$/);
  await runsPerTurnField.fill("1");

  await expect(startButton).toBeEnabled();
  await startButton.click();

  // The tablet hands itself to the host shell, which lands on the briefing —
  // and the briefing's action is the game itself, because nobody is eating.
  await expect(hostPage).toHaveURL(/\/host$/, { timeout: 15_000 });
  await expect(hostPage.getByRole("button", { name: "Start Mini-Game" })).toBeVisible();
  await expect(hostPage.getByText("Game 1 of 1")).toBeVisible();
  await expect(hostPage.getByText("Frank's")).toHaveCount(0);

  await expect(displayPage.getByText("playing", { exact: true })).toBeVisible();
  await expect(displayPage.getByText("SCHLONIC")).toBeVisible();

  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  await expect(hostPage.getByRole("button", { name: "Skip run", exact: true })).toBeVisible();
  await expect(displayMinigameTakeover(displayPage)).toBeVisible();
  await expect(displayPage.getByText(/Eating ·/)).toHaveCount(0);
  await expect(displayPage.getByText("Content Load Error")).toHaveCount(0);

  // Reset Game restores the pack's night for the specs that follow.
  await ensureSetupPhase(hostPage);
  await expect(hostPage.getByRole("link", { name: "Quick Play a mini-game" })).toBeVisible();

  await context.close();
});

// The launcher only ever starts from SETUP; a room mid-night gets the way back
// rather than a Start button.
test("quick play refuses to start over a night in progress and offers the reset", async ({
  page
}) => {
  await page.goto("/host");
  await ensureSetupPhase(page);

  await lockTeamsFromSetup(page);

  await page.goto("/quickplay");

  await expect(page.getByText("The room is mid-game.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Quick Play" })).toHaveCount(0);

  await page.getByRole("button", { name: "Reset room to setup" }).click();
  await page.getByRole("button", { name: "Yes, reset the room" }).click();

  await expect(page.getByRole("button", { name: "Start Quick Play" })).toBeVisible();
});
