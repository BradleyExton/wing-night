import { expect, test, type Page } from "@playwright/test";

const HOST_PRIMARY_ACTION_LABEL = /Lock Teams & Continue|Start Game|Open Team Briefing|Start Eating|Start Mini-Game|End Team Turn|Prepare Next Team|Show Round Results|Start Next Round|Show Final Results|Next Phase/;

const hasHeading = async (hostPage: Page, headingPattern: RegExp): Promise<boolean> => {
  const heading = hostPage.locator("h1").filter({ hasText: headingPattern });
  return (await heading.count()) > 0;
};

const clickHostPrimaryAction = async (hostPage: Page): Promise<void> => {
  await hostPage.getByRole("button", { name: HOST_PRIMARY_ACTION_LABEL }).click();
};

const ensureSetupPhase = async (hostPage: Page): Promise<void> => {
  const playerNames = ["Alex", "Jordan", "Taylor", "Casey"] as const;

  for (let attempt = 0; attempt < 20; attempt += 1) {
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

      if (teamOptionValues.length === 0) {
        await hostPage.waitForTimeout(200);
        continue;
      }

      for (let index = 0; index < playerNames.length; index += 1) {
        const playerName = playerNames[index];
        const teamValue = teamOptionValues[index % teamOptionValues.length];

        const assignmentSelect = hostPage.getByLabel(`Assign ${playerName} to a team`);

        for (let assignmentAttempt = 0; assignmentAttempt < 4; assignmentAttempt += 1) {
          await assignmentSelect.selectOption(teamValue);
          await hostPage.waitForTimeout(120);

          if ((await assignmentSelect.inputValue()) === teamValue) {
            break;
          }
        }
      }

      const autoAssignButton = hostPage.getByRole("button", {
        name: "Auto-Assign Remaining Players"
      });

      if ((await autoAssignButton.count()) > 0 && (await autoAssignButton.isEnabled())) {
        await autoAssignButton.click();
        await hostPage.waitForTimeout(200);
      }

      const primaryActionButton = hostPage.getByRole("button", {
        name: HOST_PRIMARY_ACTION_LABEL
      });

      if (!(await primaryActionButton.isEnabled())) {
        await hostPage.waitForTimeout(200);
        continue;
      }

      await clickHostPrimaryAction(hostPage);
      await hostPage.waitForTimeout(250);
      continue;
    }

    const openOverridesPanelButton = hostPage.getByRole("button", { name: /overrides/i });

    if ((await openOverridesPanelButton.count()) > 0) {
      await openOverridesPanelButton.first().click();

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

    await clickHostPrimaryAction(hostPage);
    await hostPage.waitForTimeout(250);
  }

  await expect(hostPage.locator("h1").filter({ hasText: /^Setup$/i })).toHaveCount(1);
};

const ensureTeamExists = async (hostPage: Page, teamName: string): Promise<void> => {
  const teamOption = hostPage
    .getByLabel("Assign Alex to a team")
    .locator("option")
    .filter({ hasText: teamName });

  if ((await teamOption.count()) > 0) {
    return;
  }

  const teamNameInput = hostPage.getByLabel("Team Name");
  const createTeamButton = hostPage.getByRole("button", { name: "Create Team" });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await teamNameInput.fill(teamName);
    await createTeamButton.click();
    await hostPage.waitForTimeout(250);

    if ((await teamOption.count()) > 0) {
      return;
    }
  }

  await expect(teamOption).toHaveCount(1);
};

const assignPlayerToTeam = async (
  hostPage: Page,
  playerName: string,
  teamName: string
): Promise<void> => {
  const assignmentSelect = hostPage.getByLabel(`Assign ${playerName} to a team`);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await assignmentSelect.selectOption({ label: teamName });
    await hostPage.waitForTimeout(120);

    const selectedTeamName = (
      await assignmentSelect.locator("option:checked").textContent()
    )?.trim();

    if (selectedTeamName === teamName) {
      return;
    }
  }

  await expect(assignmentSelect.locator("option:checked")).toHaveText(teamName);
};

const assignPlayers = async (hostPage: Page): Promise<void> => {
  const assignments: Array<[string, string]> = [
    ["Alex", "Team One"],
    ["Jordan", "Team One"],
    ["Taylor", "Team Two"],
    ["Casey", "Team Two"]
  ];

  for (const [playerName, teamName] of assignments) {
    await assignPlayerToTeam(hostPage, playerName, teamName);
  }
};

const ensureSetupReadyToLock = async (hostPage: Page): Promise<void> => {
  const primaryActionButton = hostPage.getByRole("button", {
    name: HOST_PRIMARY_ACTION_LABEL
  });
  const autoAssignButton = hostPage.getByRole("button", {
    name: "Auto-Assign Remaining Players"
  });

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await primaryActionButton.isEnabled()) {
      return;
    }

    if ((await autoAssignButton.count()) > 0 && (await autoAssignButton.isEnabled())) {
      await autoAssignButton.click();
      await hostPage.waitForTimeout(250);
    } else {
      await hostPage.waitForTimeout(150);
    }
  }

  await expect(primaryActionButton).toBeEnabled();
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

    await clickHostPrimaryAction(hostPage);
    await hostPage.waitForTimeout(250);
  }

  await expect(phaseHeading).toHaveCount(1);
};

test("override dock score updates sync to display and panel closes on escape/scrim", async ({
  browser
}) => {
  const context = await browser.newContext();
  const hostPage = await context.newPage();
  const displayPage = await context.newPage();

  await hostPage.goto("/host");
  await displayPage.goto("/display");

  await expect(hostPage.locator("h1")).toHaveCount(1);
  await ensureSetupPhase(hostPage);

  await ensureTeamExists(hostPage, "Team One");
  await ensureTeamExists(hostPage, "Team Two");

  await assignPlayers(hostPage);
  await ensureSetupReadyToLock(hostPage);

  await advanceUntilHeading(hostPage, /^Intro$/i);
  await advanceUntilHeading(hostPage, /^Round Intro$/i);

  await hostPage.getByRole("button", { name: /open overrides panel/i }).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  await hostPage.getByLabel("Team").selectOption({ label: "Team One" });
  await hostPage.getByLabel("Score Delta").fill("2");
  await hostPage.getByRole("button", { name: "Apply" }).click();

  await expect(displayPage.getByText("Team One", { exact: true })).toBeVisible();
  await expect(displayPage.getByText("2 pts", { exact: true })).toBeVisible();

  await hostPage.keyboard.press("Escape");
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);
  await expect(hostPage.getByRole("button", { name: /open overrides panel/i })).toBeVisible();

  await hostPage.setViewportSize({ width: 390, height: 844 });
  await hostPage.getByRole("button", { name: /open overrides panel/i }).click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(1);

  const scrimDismissButton = hostPage
    .locator("button[aria-label='Close overrides panel']")
    .last();
  await scrimDismissButton.click();
  await expect(hostPage.getByRole("dialog")).toHaveCount(0);

  await context.close();
});
