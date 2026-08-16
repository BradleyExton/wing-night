import { expect, test } from "@playwright/test";

import {
  ensureSetupPhase,
  lockTeamsFromSetup,
  openTeamBriefingFromRoundIntro,
  startEatingFromBriefing,
  startGameFromIntro
} from "./hostShell";

// Mirrors TEAM_AUDIO_ROUTE_PATH in packages/shared. Re-declared rather than
// imported because nothing under tests/e2e depends on the workspace packages —
// this suite drives the built app over HTTP and stays black-box.
const TEAM_AUDIO_ROUTE_PATH = "/team-audio";

// A root-relative src makes `new URL(src)` throw; a `window.location.origin`
// based src makes the two origins compare equal. Both go red.
const assertAbsoluteServerOriginSrc = (
  src: string | null,
  displayPageUrl: string
): void => {
  expect(src).not.toBeNull();

  const anthemUrl = new URL(src as string);
  const displayOrigin = new URL(displayPageUrl).origin;

  expect(anthemUrl.origin).not.toBe(displayOrigin);
  expect(anthemUrl.pathname.startsWith(`${TEAM_AUDIO_ROUTE_PATH}/`)).toBe(true);
};

// The check that goes red on a wrong base URL — the failure mode no unit test
// can see. Deliberately port-agnostic: it compares the anthem origin against the
// display page's OWN origin rather than hardcoding 3100/5273, so it survives the
// WN-5 port pinning.
test("display anthem src is an absolute url on the server origin, and stops at EATING", async ({
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

  // Let the 3-2-1 countdown finish before advancing, as the sibling spec does.
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0, {
    timeout: 6_000
  });

  await openTeamBriefingFromRoundIntro(hostPage);

  const anthem = displayPage.locator("audio[data-team-anthem]");

  await expect(anthem).toHaveCount(1);
  await expect(anthem).toHaveAttribute("src", /.+/);

  assertAbsoluteServerOriginSrc(
    await anthem.getAttribute("src"),
    displayPage.url()
  );

  // Tap the overlay BEFORE advancing. Without this the element is never started,
  // so the paused assertion below would be trivially true and could not fail on
  // the stuck-anthem case it exists to catch.
  const unlockOverlay = displayPage.locator("[data-audio-unlock-overlay]");

  await expect(unlockOverlay).toBeVisible();
  await unlockOverlay.click();
  await expect(unlockOverlay).toHaveCount(0);

  await startEatingFromBriefing(hostPage);

  await expect(displayPage.getByText("Eating · Frank's")).toBeVisible();
  await expect(anthem).toHaveJSProperty("paused", true);

  await expect(displayPage.getByText("Content Load Error")).toHaveCount(0);

  await context.close();
});
