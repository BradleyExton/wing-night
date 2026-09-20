import { expect, test } from "@playwright/test";

import {
  ensureSetupPhase,
  lockTeamsFromSetup,
  startEatingFromBriefing,
  startGameFromIntro,
  startMinigameFromEating
} from "./hostShell";

// MINIGAME_PLAY is the one phase where the tablet leaves the host's hands, so
// the shell's own controls collapse into the corner dock (DESIGN.md §2.0A).
// This walks the real chain to that phase rather than the sandbox, because the
// thing under test is the shell wiring: the dock's button has to advance the
// game, not just render.
test("host takeover dock hides the CTA during play and still advances the turn", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);
  await lockTeamsFromSetup(hostPage);
  await startGameFromIntro(hostPage);

  // The briefing is still host-driven, so it keeps the full-bleed CTA bar and
  // never grows a corner dock.
  await expect(
    hostPage.getByRole("button", { name: "Start Eating" })
  ).toBeVisible();
  await expect(
    hostPage.getByRole("button", { name: "Open host controls" })
  ).toHaveCount(0);

  await startEatingFromBriefing(hostPage);
  await startMinigameFromEating(hostPage);

  const dockToggle = hostPage.getByRole("button", { name: "Open host controls" });
  const endTurnButton = hostPage.getByRole("button", { name: "End Team Turn" });

  // Collapsed: nothing a player can lean on ends their own turn.
  await expect(dockToggle).toBeVisible();
  await expect(endTurnButton).toHaveCount(0);

  await dockToggle.click();
  await expect(endTurnButton).toBeVisible();

  // Escape puts the dock away without advancing anything.
  await hostPage.keyboard.press("Escape");
  await expect(endTurnButton).toHaveCount(0);
  await expect(displayPage.getByText("On the clock:")).toBeVisible();

  await dockToggle.click();
  await expect(
    hostPage.getByRole("button", { name: "Overrides", exact: true })
  ).toBeVisible();
  await endTurnButton.click();

  // The turn really ended: the display has left the mini-game takeover.
  await expect(displayPage.getByText("On the clock:")).toHaveCount(0);

  await ensureSetupPhase(hostPage);
  await context.close();
});
