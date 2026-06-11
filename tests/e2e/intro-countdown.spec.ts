import { expect, test } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup } from "./hostShell";

test("intro lock screen transitions to round-intro countdown on display", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);
  await lockTeamsFromSetup(hostPage);

  await expect(hostPage.getByText("Game Locked In")).toBeVisible();
  await expect(hostPage.getByRole("button", { name: "Start Game" })).toBeVisible();

  await expect(displayPage.getByText("Locked In")).toBeVisible();
  await expect(
    displayPage.getByText("Host is ready to launch the round.")
  ).toBeVisible();

  await hostPage.getByRole("button", { name: "Start Game" }).click();

  await expect(displayPage.getByText("Game starts in")).toBeVisible();
  await expect(displayPage.getByText(/^3$/)).toBeVisible();
  await expect(displayPage.getByText(/^2$/)).toBeVisible({ timeout: 2_500 });
  await expect(displayPage.getByText(/^1$/)).toBeVisible({ timeout: 2_500 });

  await expect(
    hostPage.getByRole("button", { name: "Open Team Briefing" })
  ).toBeVisible();
  await expect(hostPage.locator("header").getByText("Round 1 of 3")).toBeVisible();
  await expect(hostPage.getByText("Game starts in")).toHaveCount(0);

  await expect(displayPage.getByText("Coming up")).toBeVisible();
  await expect(displayPage.getByText("Warm Up")).toBeVisible();
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0);
  await expect(displayPage.getByText("Frank's")).toBeVisible();
  await expect(displayPage.getByText("TRIVIA")).toBeVisible();

  await context.close();
});
