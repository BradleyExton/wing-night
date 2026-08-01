import { expect, test } from "@playwright/test";

import {
  ensureSetupPhase,
  lockTeamsFromSetup,
  openTeamBriefingFromRoundIntro,
  startEatingFromBriefing,
  startGameFromIntro,
  startMinigameFromEating
} from "./hostShell";

test("display follows host phase advances through the round-1 milestone chain", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);
  await lockTeamsFromSetup(hostPage);

  await expect(displayPage.getByText("Locked In")).toBeVisible();

  await startGameFromIntro(hostPage);

  // Round intro: let the 3-2-1 countdown finish before asserting the surface.
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0, {
    timeout: 6_000
  });
  await expect(displayPage.getByText("Coming up")).toBeVisible();
  await expect(displayPage.getByText("Warm Up")).toBeVisible();

  // Team briefing (MINIGAME_INTRO): the display announces the team on the wings.
  await openTeamBriefingFromRoundIntro(hostPage);

  await expect(displayPage.getByText("playing", { exact: true })).toBeVisible();
  await expect(displayPage.getByText("TRIVIA")).toBeVisible();

  // Eating: the briefing surface yields to the sauce timer.
  await startEatingFromBriefing(hostPage);

  await expect(displayPage.getByText("Eating · Frank's")).toBeVisible();
  await expect(displayPage.getByText("playing", { exact: true })).toHaveCount(0);

  // Mini-game play: the trivia takeover replaces the eating surface.
  await startMinigameFromEating(hostPage);

  await expect(displayPage.getByText("On the clock:")).toBeVisible();
  await expect(displayPage.getByText("Eating · Frank's")).toHaveCount(0);

  await expect(displayPage.getByText("Content Load Error")).toHaveCount(0);

  await context.close();
});
