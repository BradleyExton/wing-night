import assert from "node:assert/strict";
import { expect, test, type Page } from "@playwright/test";

const hasHeading = async (hostPage: Page, headingPattern: RegExp): Promise<boolean> => {
  const heading = hostPage.locator("h1").filter({ hasText: headingPattern });
  return (await heading.count()) > 0;
};

const ensureSetupPhase = async (hostPage: Page): Promise<void> => {
  const playerNames = ["Alex", "Jordan", "Taylor", "Casey"] as const;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (
      (await hasHeading(hostPage, /^Setup$/i)) &&
      (await hostPage.getByText("No teams created yet.", { exact: true }).count()) > 0
    ) {
      return;
    }

    if (await hasHeading(hostPage, /^Setup$/i)) {
      const teamOptionValues = await hostPage
        .getByLabel("Assign Alex to a team")
        .locator("option")
        .evaluateAll((options) => {
          return options
            .map((option) => option.getAttribute("value") ?? "")
            .filter((value) => value.length > 0);
        });

      if (teamOptionValues.length > playerNames.length) {
        throw new Error("Unable to normalize setup state: team count exceeds available players.");
      }

      for (let index = 0; index < playerNames.length; index += 1) {
        const playerName = playerNames[index];
        const teamValue = teamOptionValues[index % teamOptionValues.length];
        await hostPage.getByLabel(`Assign ${playerName} to a team`).selectOption(teamValue);
      }

      await hostPage.getByRole("button", { name: "Next Phase" }).click();
      await hostPage.waitForTimeout(250);
      continue;
    }

    const openOverridesPanelButton = hostPage.getByRole("button", {
      name: /open overrides panel/i
    });

    if ((await openOverridesPanelButton.count()) > 0) {
      await openOverridesPanelButton.click();

      const resetGameButton = hostPage.getByRole("button", { name: "Reset Game" });

      if ((await resetGameButton.count()) > 0) {
        await resetGameButton.click();
        const confirmButton = hostPage.getByRole("button", { name: "Confirm" });

        if ((await confirmButton.count()) > 0) {
          await confirmButton.click();
        }

        await hostPage.waitForTimeout(300);
        continue;
      }
    }

    await hostPage.getByRole("button", { name: "Next Phase" }).click();
    await hostPage.waitForTimeout(250);
  }

  await expect(hostPage.locator("h1").filter({ hasText: /^Setup$/i })).toHaveCount(1);
};

const ensureTeamExists = async (hostPage: Page, teamName: string): Promise<void> => {
  const teamMatches = hostPage.getByText(teamName, { exact: true });

  if ((await teamMatches.count()) > 0) {
    return;
  }

  const teamNameInput = hostPage.getByLabel("Team Name");
  const createTeamButton = hostPage.getByRole("button", { name: "Create Team" });

  await teamNameInput.fill(teamName);
  await createTeamButton.click();
  await hostPage.waitForTimeout(250);

  if ((await teamMatches.count()) === 0) {
    await teamNameInput.fill(teamName);
    await createTeamButton.click();
    await hostPage.waitForTimeout(250);
  }

  await expect(teamMatches.first()).toBeVisible();
};

const assignPlayers = async (hostPage: Page): Promise<void> => {
  const assignments: Array<[string, string]> = [
    ["Alex", "Team One"],
    ["Jordan", "Team One"],
    ["Taylor", "Team Two"],
    ["Casey", "Team Two"]
  ];

  for (const [playerName, teamName] of assignments) {
    await hostPage.getByLabel(`Assign ${playerName} to a team`).selectOption({ label: teamName });
  }
};

const advanceUntilHeading = async (
  hostPage: Page,
  phaseHeadingPattern: RegExp
): Promise<void> => {
  const phaseHeading = hostPage.locator("h1").filter({ hasText: phaseHeadingPattern });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if ((await phaseHeading.count()) > 0) {
      return;
    }

    await hostPage.getByRole("button", { name: "Next Phase" }).click();
    await hostPage.waitForTimeout(250);
  }

  await expect(phaseHeading).toHaveCount(1);
};

const prepareMinigameIntro = async (hostPage: Page): Promise<void> => {
  await ensureSetupPhase(hostPage);
  await ensureTeamExists(hostPage, "Team One");
  await ensureTeamExists(hostPage, "Team Two");
  await assignPlayers(hostPage);
  await advanceUntilHeading(hostPage, /^Intro$/i);
  await advanceUntilHeading(hostPage, /^Round Intro$/i);
  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("h1").filter({ hasText: /^Eating$/i })).toHaveCount(1);
  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("[data-host-minigame-takeover='intro']")).toHaveCount(1);
};

const prepareMinigamePlay = async (hostPage: Page): Promise<void> => {
  await prepareMinigameIntro(hostPage);
  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("[data-host-minigame-takeover='play']")).toHaveCount(1);
};

test("host refresh in MINIGAME_INTRO rehydrates takeover with active team continuity", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await prepareMinigameIntro(hostPage);
  await expect(displayPage.locator("[data-display-minigame-takeover='intro']")).toHaveCount(1);
  await expect(hostPage.getByText("Team One", { exact: true }).first()).toBeVisible();
  await expect(displayPage.getByText("Team One", { exact: true }).first()).toBeVisible();

  await hostPage.reload();

  await expect(hostPage.locator("[data-host-minigame-takeover='intro']")).toHaveCount(1);
  await expect(hostPage.getByText("Team One", { exact: true }).first()).toBeVisible();

  await context.close();
});

test("display refresh in MINIGAME_PLAY preserves prompt and active team continuity", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await prepareMinigamePlay(hostPage);

  const takeoverPlay = displayPage.locator("[data-display-minigame-takeover='play']");
  await expect(takeoverPlay).toHaveCount(1);
  await expect(displayPage.getByText("Team One", { exact: true }).first()).toBeVisible();

  const questionValue = displayPage
    .getByText("Question", { exact: true })
    .locator("xpath=following-sibling::p");
  await expect(questionValue).toHaveCount(1);
  const questionBeforeRefresh = (await questionValue.first().textContent())?.trim() ?? "";
  assert.ok(questionBeforeRefresh.length > 0);

  await displayPage.reload();

  await expect(displayPage.locator("[data-display-minigame-takeover='play']")).toHaveCount(1);
  await expect(displayPage.getByText("Team One", { exact: true }).first()).toBeVisible();
  await expect(
    displayPage.getByText("Question", { exact: true }).locator("xpath=following-sibling::p")
  ).toHaveText(questionBeforeRefresh);

  await context.close();
});

test("invalid host secret during takeover is reclaimed and next mutation syncs", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await prepareMinigamePlay(hostPage);
  await expect(displayPage.locator("[data-display-minigame-takeover='play']")).toHaveCount(1);

  await hostPage.evaluate(() => {
    window.localStorage.setItem("wingnight.hostSecret", "invalid-host-secret");
  });

  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("[data-host-minigame-takeover='play']")).toHaveCount(1);

  await expect
    .poll(async () => {
      return hostPage.evaluate(() => window.localStorage.getItem("wingnight.hostSecret"));
    })
    .not.toBe("invalid-host-secret");

  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("[data-host-minigame-takeover='play']")).toHaveCount(0);
  await expect(hostPage.locator("h1").filter({ hasText: /^Eating$/i })).toHaveCount(1);
  await expect(displayPage.locator("[data-display-minigame-takeover='play']")).toHaveCount(0);
  await expect(displayPage.getByText("Round Timer", { exact: true })).toBeVisible();

  await context.close();
});
