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

      for (let index = 0; index < playerNames.length; index += 1) {
        const playerName = playerNames[index];
        const teamValue = teamOptionValues[index % teamOptionValues.length];

        if (teamValue === undefined) {
          return;
        }

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

test("intro lock screen transitions to round-intro countdown on display", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await ensureSetupPhase(hostPage);
  await ensureTeamExists(hostPage, "Team One");
  await ensureTeamExists(hostPage, "Team Two");
  await assignPlayers(hostPage);

  await hostPage.getByRole("button", { name: "Next Phase" }).click();
  await expect(hostPage.locator("h1").filter({ hasText: /^Intro$/i })).toHaveCount(1);
  await expect(hostPage.getByText("Game Locked In")).toBeVisible();
  await expect(hostPage.getByRole("button", { name: "Start Game" })).toBeVisible();

  await expect(displayPage.getByText("Game Locked In")).toBeVisible();
  await expect(displayPage.getByText("Host is about to start Round 1.")).toBeVisible();

  await hostPage.getByRole("button", { name: "Start Game" }).click();

  await expect(hostPage.locator("h1").filter({ hasText: /^Round Intro$/i })).toHaveCount(1);
  await expect(hostPage.getByRole("button", { name: "Next Phase" })).toBeVisible();
  await expect(hostPage.getByText("Game Starts In")).toHaveCount(0);

  await expect(displayPage.getByText("Game Starts In")).toBeVisible();
  await expect(displayPage.getByText(/^3$/)).toBeVisible();
  await expect(displayPage.getByText(/^2$/)).toBeVisible({ timeout: 2_500 });
  await expect(displayPage.getByText(/^1$/)).toBeVisible({ timeout: 2_500 });

  await expect(displayPage.getByText("Round 1: Warm Up")).toBeVisible();
  await expect(displayPage.getByText("Game Starts In")).toHaveCount(0);
  await expect(displayPage.getByText("Sauce")).toBeVisible();
  await expect(displayPage.getByText("Mini-Game")).toBeVisible();

  await context.close();
});
