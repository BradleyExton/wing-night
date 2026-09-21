import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  displayMinigameTakeover,
  ensureSetupPhase,
  lockTeamsFromSetup,
  startEatingFromBriefing,
  startGameFromIntro,
  startMinigameFromEating
} from "./hostShell";

// apps/client/src/copy/display.ts:9 — rendered by FallbackStageBody whenever
// roomState is still null, i.e. the display has not received a snapshot yet.
// Its absence is what proves the reload actually rehydrated, rather than the
// milestone surface merely happening to be missing for some other reason.
const PRE_SNAPSHOT_PLACEHOLDER = "Waiting for room state...";

const EATING_MILESTONE_SURFACE = "Eating · Frank's";

// Room state is one in-memory singleton shared by every spec in the run, so a
// spec that ends mid-game hands the next one a surface it never asked for —
// MINIGAME_PLAY in particular replaces the host header smoke.spec.ts asserts on.
// Both tests below therefore hand the game back the way they found it.

// Drives the host to the EATING milestone and waits for the display to settle on
// it — the shared starting point for both reloads.
const advanceToEatingMilestone = async (
  hostPage: Page,
  displayPage: Page
): Promise<void> => {
  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);
  await lockTeamsFromSetup(hostPage);
  await startGameFromIntro(hostPage);
  await startEatingFromBriefing(hostPage);

  // Reload only once a stable milestone surface is up — never mid-countdown, so
  // no assertion races a phase changing underneath it.
  await expect(displayPage.getByText(EATING_MILESTONE_SURFACE)).toBeVisible();
};

// A fresh page load rehydrates entirely off the server's unsolicited snapshot:
// wireRoomStateRehydration guards its REQUEST_STATE emit with
// `if (socket.connected)` (apps/client/src/utils/wireRoomStateRehydration/index.ts:31),
// which is false during the mount that follows a reload.
// The milestone is a Locator, not a string: locators resolve lazily, so one
// built before the reload still addresses the page that comes back.
const expectRehydratesTo = async (
  displayPage: Page,
  milestoneSurface: Locator
): Promise<void> => {
  await displayPage.reload();

  await expect(milestoneSurface).toBeVisible();
  await expect(displayPage.getByText(PRE_SNAPSHOT_PLACEHOLDER)).toHaveCount(0);
};

test("display rehydrates the eating milestone when it is reloaded mid-game", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await advanceToEatingMilestone(hostPage, displayPage);

  await expectRehydratesTo(displayPage, displayPage.getByText(EATING_MILESTONE_SURFACE));

  await ensureSetupPhase(hostPage);
  await context.close();
});

test("display rehydrates the mini-game takeover when it is reloaded mid-game", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await advanceToEatingMilestone(hostPage, displayPage);
  await startMinigameFromEating(hostPage);

  await expect(displayMinigameTakeover(displayPage)).toBeVisible();

  await expectRehydratesTo(displayPage, displayMinigameTakeover(displayPage));

  await ensureSetupPhase(hostPage);
  await context.close();
});
