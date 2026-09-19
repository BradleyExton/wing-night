import { expect, type Locator, type Page } from "@playwright/test";

export const HOST_PRIMARY_ACTION_LABEL =
  /Lock Teams & Continue|Start Game|Open Team Briefing|Start Eating|Start Mini-Game|End Team Turn|Prepare Next Team|Show Round Results|Start Next Round|Show Final Results|Game Complete|Next Phase/;

export const hostPrimaryActionButton = (hostPage: Page): Locator => {
  return hostPage.getByRole("button", { name: HOST_PRIMARY_ACTION_LABEL });
};

// Both the control deck and the fixed dock trigger are labelled "Open overrides
// panel"; either one opens the dock, so always target the first match.
export const openOverridesPanelButton = (hostPage: Page): Locator => {
  return hostPage.getByRole("button", { name: "Open overrides panel" }).first();
};

// During MINIGAME_PLAY the tablet is in the players' hands, so the host's CTA
// bar and overrides entry both collapse into one corner dock
// (HostTakeoverDock). Nothing host-facing is reachable until it is opened.
// Best effort by design: callers run this mid-transition, so the dock is just
// as likely to be absent, or to detach between being found and being clicked,
// as it is to open. Either way the caller carries on and re-checks the phase.
const openTakeoverDockIfCollapsed = async (hostPage: Page): Promise<void> => {
  const dockToggle = hostPage.getByRole("button", { name: "Open host controls" });

  try {
    await dockToggle.click({ timeout: 1_000 });
  } catch {
    return;
  }
};

const resetGameFromOverrides = async (hostPage: Page): Promise<void> => {
  await openTakeoverDockIfCollapsed(hostPage);
  await openOverridesPanelButton(hostPage).click();
  await hostPage.getByRole("button", { name: "Reset Game" }).click();
  await hostPage.getByRole("button", { name: "Confirm", exact: true }).click();
};

export const ensureSetupPhase = async (hostPage: Page): Promise<void> => {
  const setupPhaseEyebrow = hostPage.getByText("Setup", { exact: true });
  const primaryActionButton = hostPrimaryActionButton(hostPage);
  const overridesButton = openOverridesPanelButton(hostPage);

  await openTakeoverDockIfCollapsed(hostPage);
  await expect(primaryActionButton).toBeVisible();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if ((await setupPhaseEyebrow.count()) > 0) {
      return;
    }

    await openTakeoverDockIfCollapsed(hostPage);

    if ((await overridesButton.count()) > 0) {
      await resetGameFromOverrides(hostPage);
      await expect(setupPhaseEyebrow).toBeVisible();
      return;
    }

    if (await primaryActionButton.isEnabled()) {
      await primaryActionButton.click();
    }

    await hostPage.waitForTimeout(250);
  }

  await expect(setupPhaseEyebrow).toBeVisible();
};

export const lockTeamsFromSetup = async (hostPage: Page): Promise<void> => {
  const primaryActionButton = hostPrimaryActionButton(hostPage);

  await expect(primaryActionButton).toHaveText("Lock Teams & Continue");

  if (!(await primaryActionButton.isEnabled())) {
    await hostPage
      .getByRole("button", { name: "Auto-Assign Remaining Players" })
      .click();
  }

  await expect(primaryActionButton).toBeEnabled();
  await primaryActionButton.click();

  await expect(hostPage.getByRole("button", { name: "Start Game" })).toBeVisible();
};

export const startGameFromIntro = async (hostPage: Page): Promise<void> => {
  await hostPage.getByRole("button", { name: "Start Game" }).click();

  await expect(
    hostPage.getByRole("button", { name: "Open Team Briefing" })
  ).toBeVisible();
};

export const openTeamBriefingFromRoundIntro = async (
  hostPage: Page
): Promise<void> => {
  await hostPage.getByRole("button", { name: "Open Team Briefing" }).click();

  await expect(
    hostPage.getByRole("button", { name: "Start Eating" })
  ).toBeVisible();
};

export const startEatingFromBriefing = async (hostPage: Page): Promise<void> => {
  await hostPage.getByRole("button", { name: "Start Eating" }).click();

  await expect(
    hostPage.getByRole("button", { name: "Start Mini-Game" })
  ).toBeVisible();
};

// MINIGAME_PLAY replaces the host control deck with the full-screen takeover, so
// the arrival signal is the trivia surface's grading control, not a phase label.
export const startMinigameFromEating = async (hostPage: Page): Promise<void> => {
  await hostPage.getByRole("button", { name: "Start Mini-Game" }).click();

  await expect(
    hostPage.getByRole("button", { name: "Correct", exact: true })
  ).toBeVisible();
};
