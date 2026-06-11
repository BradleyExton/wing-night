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

const resetGameFromOverrides = async (hostPage: Page): Promise<void> => {
  await openOverridesPanelButton(hostPage).click();
  await hostPage.getByRole("button", { name: "Reset Game" }).click();
  await hostPage.getByRole("button", { name: "Confirm", exact: true }).click();
};

export const ensureSetupPhase = async (hostPage: Page): Promise<void> => {
  const setupPhaseEyebrow = hostPage.getByText("Setup", { exact: true });
  const primaryActionButton = hostPrimaryActionButton(hostPage);
  const overridesButton = openOverridesPanelButton(hostPage);

  await expect(primaryActionButton).toBeVisible();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if ((await setupPhaseEyebrow.count()) > 0) {
      return;
    }

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
