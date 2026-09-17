import { expect, test } from "@playwright/test";

import {
  ensureSetupPhase,
  lockTeamsFromSetup,
  openOverridesPanelButton,
  startGameFromIntro
} from "./hostShell";

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

  await openOverridesPanelButton(hostPage).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  // The team name is READ from the select rather than written in here. Team names
  // are party content — `content/sample/teams.json` is the host's own pack and
  // gets renamed whenever the party's genres do — so a literal here makes a
  // content edit fail a spec that is really about override sync. The options are
  // the teams themselves (value = id, label = name), with no placeholder row.
  const teamSelect = hostPage.getByLabel("Team", { exact: true });
  const adjustedTeamName =
    (await teamSelect.locator("option").first().textContent())?.trim() ?? "";

  expect(adjustedTeamName).not.toBe("");

  await teamSelect.selectOption({ label: adjustedTeamName });
  await hostPage.getByLabel("Score Delta").fill("2");
  await hostPage.getByRole("button", { name: "Apply" }).click();

  const adjustedTeamColumn = displayPage
    .locator("footer > div")
    .filter({ hasText: adjustedTeamName });
  await expect(adjustedTeamColumn).toHaveCount(1);
  await expect(adjustedTeamColumn.getByText("2", { exact: true })).toBeVisible();
  await expect(adjustedTeamColumn.getByText("Leading")).toBeVisible();

  await hostPage.keyboard.press("Escape");
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);
  await expect(openOverridesPanelButton(hostPage)).toBeVisible();

  await hostPage.setViewportSize({ width: 390, height: 844 });
  await openOverridesPanelButton(hostPage).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  const scrimDismissButton = hostPage
    .locator("button[aria-label='Close overrides panel']")
    .last();
  await scrimDismissButton.click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);

  await context.close();
});
