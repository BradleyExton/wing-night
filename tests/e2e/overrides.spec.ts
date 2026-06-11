import { expect, test } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup, startGameFromIntro } from "./hostShell";

test("override dock score updates sync to display and panel closes on escape/scrim", async ({
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

  await hostPage.getByRole("button", { name: "Open overrides panel" }).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  await hostPage
    .getByLabel("Team", { exact: true })
    .selectOption({ label: "Scorch Squad" });
  await hostPage.getByLabel("Score Delta").fill("2");
  await hostPage.getByRole("button", { name: "Apply" }).click();

  const adjustedTeamColumn = displayPage
    .locator("footer > div")
    .filter({ hasText: "Scorch Squad" });
  await expect(adjustedTeamColumn).toHaveCount(1);
  await expect(adjustedTeamColumn.getByText("2", { exact: true })).toBeVisible();
  await expect(adjustedTeamColumn.getByText("Leading")).toBeVisible();

  await hostPage.keyboard.press("Escape");
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);
  await expect(
    hostPage.getByRole("button", { name: "Open overrides panel" })
  ).toBeVisible();

  await hostPage.setViewportSize({ width: 390, height: 844 });
  await hostPage.getByRole("button", { name: "Open overrides panel" }).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  const scrimDismissButton = hostPage
    .locator("button[aria-label='Close overrides panel']")
    .last();
  await scrimDismissButton.click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);

  await context.close();
});
