import { expect, test, type Page } from "@playwright/test";

import { ensureSetupPhase, hostPrimaryActionButton } from "./hostShell";

// Round 2 deliberately, never round 1: `host-display-sync`, `refresh-rehydrate`
// and `intro-countdown` all assert on round 1's values ("Warm Up", "Frank's",
// "TRIVIA"). Nothing asserts on round 2's label, and nothing here adds or
// removes a round, so `intro-countdown`'s "Round 1 of 3" also stays true.
const EDITED_ROUND_INDEX = 1;
const EDITED_ROUND_LABEL = "Second Heat Rewired";

// Applying is only legal during SETUP, so both scenarios start from a known
// phase rather than from whatever the previous spec left behind.
const restoreSetupPhase = async (page: Page): Promise<void> => {
  await page.goto("/host");
  await ensureSetupPhase(page);
};

const openWizard = async (page: Page): Promise<void> => {
  await page.goto("/admin");

  // The wizard cannot render a draft until `config:read` has replied, which
  // only happens once the host claim has issued a secret.
  await expect(page.getByRole("button", { name: /Lineup/ })).toBeVisible();
  await page.getByRole("button", { name: /Lineup/ }).click();
  await expect(page.locator(`#admin-round-label-${EDITED_ROUND_INDEX}`)).toBeVisible();
};

const openWizardStep = async (page: Page, stepTitle: RegExp): Promise<void> => {
  await expect(page.getByRole("button", { name: stepTitle })).toBeVisible();
  await page.getByRole("button", { name: stepTitle }).click();
};

const editRoundLabelAndReview = async (
  page: Page,
  label: string
): Promise<void> => {
  await page.locator(`#admin-round-label-${EDITED_ROUND_INDEX}`).fill(label);
  await page.getByRole("button", { name: /Review/ }).click();
};

test("applies an edited round label from /admin and the display picks it up", async ({
  browser
}) => {
  const context = await browser.newContext();

  // The server keeps ONE host secret, last claim wins. /host and /admin are
  // therefore opened strictly in sequence and never held open together: an
  // overlapping claim would sign the other tab out and make this spec's
  // outcome depend on which tab claimed last.
  const hostPage = await context.newPage();
  await restoreSetupPhase(hostPage);
  await hostPage.close();

  const adminPage = await context.newPage();
  await openWizard(adminPage);
  await editRoundLabelAndReview(adminPage, EDITED_ROUND_LABEL);

  await adminPage.getByRole("button", { name: "Apply config & reload room" }).click();

  // The applied confirmation only renders once `config:result` came back ok for
  // the apply action — so this asserts the round trip, not just the click.
  await expect(adminPage.getByRole("button", { name: "Applied ✓" })).toBeVisible();

  // /display never claims host control, so it can be opened alongside /admin.
  // It renders every round's label in the SETUP preview, which is where the
  // re-seeded room state becomes observable.
  const displayPage = await context.newPage();
  await displayPage.goto("/display");

  await expect(displayPage.getByText(EDITED_ROUND_LABEL)).toBeVisible();
  await expect(displayPage.getByText("Content Load Error")).toHaveCount(0);

  await adminPage.close();

  // The host half: it does not render round LABELS anywhere in SETUP (only
  // "Round N of M"), so what it can prove is that the re-seed left the room
  // healthy and still three rounds long rather than that it sees the string.
  const rehostPage = await context.newPage();
  await rehostPage.goto("/host");

  await expect(hostPrimaryActionButton(rehostPage)).toBeVisible();
  await expect(rehostPage.getByText("Content Load Error")).toHaveCount(0);

  await ensureSetupPhase(rehostPage);

  await context.close();
});

// A rename rather than an add: the roster the rest of the suite runs against
// keeps its 16 players and 4 teams, and `overrides.spec.ts` still finds
// "Scorch Squad". Nothing else in the suite asserts on a player name or on a
// trivia answer, so this pair is safe to leave applied for the specs that
// follow — the seeded root is wiped and re-seeded at the start of every run.
const EDITED_PLAYER_NAME = "Preflight Pat";
const EDITED_TRIVIA_ANSWER = "Rewritten answer";

test("applies edits to two content files in one apply and both survive a reload", async ({
  browser
}) => {
  const context = await browser.newContext();

  // Same one-secret sequencing as above: /host is closed before /admin claims.
  const hostPage = await context.newPage();
  await restoreSetupPhase(hostPage);
  await hostPage.close();

  const adminPage = await context.newPage();
  await openWizard(adminPage);

  // players.json and minigames/trivia.json — two DIFFERENT files, edited before
  // a single apply. `selectDirtyEdits` has to send both and neither of the
  // untouched three, which is the whole point of the multi-file draft.
  await openWizardStep(adminPage, /Roster/);
  await adminPage.locator("#admin-player-name-0").fill(EDITED_PLAYER_NAME);

  await openWizardStep(adminPage, /Prompt Packs/);
  await adminPage.locator("#admin-trivia-answer-0").fill(EDITED_TRIVIA_ANSWER);

  await openWizardStep(adminPage, /Review/);
  await adminPage.getByRole("button", { name: "Apply config & reload room" }).click();
  await expect(adminPage.getByRole("button", { name: "Applied ✓" })).toBeVisible();

  // Reloading re-reads from disk, so a value that survives the round trip was
  // written to the content root rather than only held in the draft.
  await adminPage.reload();
  await openWizardStep(adminPage, /Roster/);
  await expect(adminPage.locator("#admin-player-name-0")).toHaveValue(
    EDITED_PLAYER_NAME
  );

  await openWizardStep(adminPage, /Prompt Packs/);
  await expect(adminPage.locator("#admin-trivia-answer-0")).toHaveValue(
    EDITED_TRIVIA_ANSWER
  );

  await adminPage.close();

  // The room half: apply re-seeds room state from disk, so the renamed player
  // is on the host's SETUP deck without anyone re-reading the file by hand.
  const rehostPage = await context.newPage();
  await rehostPage.goto("/host");

  await expect(rehostPage.getByText(EDITED_PLAYER_NAME)).toBeVisible();
  await expect(rehostPage.getByText("Content Load Error")).toHaveCount(0);

  await ensureSetupPhase(rehostPage);

  await context.close();
});

test("blocks the apply and names the offending field when a roster entry is emptied", async ({
  browser
}) => {
  const context = await browser.newContext();

  const hostPage = await context.newPage();
  await restoreSetupPhase(hostPage);
  await hostPage.close();

  const adminPage = await context.newPage();
  await openWizard(adminPage);

  await openWizardStep(adminPage, /Roster/);
  await adminPage.locator("#admin-team-name-0").fill("");

  // The issue is raised against the emptied field itself, in the coordinates
  // the shared validator reports — not as a banner detached from the input.
  await expect(
    adminPage.getByText("must be a non-empty string").first()
  ).toBeVisible();

  // An invalid file blocks the apply from ANY step, not only the one being
  // edited: the Review gate reads the whole draft.
  await openWizardStep(adminPage, /Review/);
  const applyButton = adminPage.getByRole("button", {
    name: "Fix the highlighted fields first"
  });

  await expect(applyButton).toBeVisible();
  await expect(applyButton).toBeDisabled();

  // Closing without applying leaves disk untouched, so nothing to restore.
  await adminPage.close();

  const restorePage = await context.newPage();
  await restoreSetupPhase(restorePage);

  await context.close();
});

test("refuses to apply and names the escape hatch when the room is past SETUP", async ({
  browser
}) => {
  const context = await browser.newContext();

  // Advance out of SETUP, then close the tab before /admin claims — same
  // one-secret sequencing rule as above.
  const hostPage = await context.newPage();
  await restoreSetupPhase(hostPage);

  const primaryActionButton = hostPrimaryActionButton(hostPage);

  if (!(await primaryActionButton.isEnabled())) {
    await hostPage
      .getByRole("button", { name: "Auto-Assign Remaining Players" })
      .click();
  }

  await primaryActionButton.click();
  await expect(hostPage.getByRole("button", { name: "Start Game" })).toBeVisible();
  await hostPage.close();

  const adminPage = await context.newPage();
  await openWizard(adminPage);
  await editRoundLabelAndReview(adminPage, "Locked Out Edit");

  await adminPage.getByRole("button", { name: "Apply config & reload room" }).click();

  await expect(
    adminPage.getByText("Config locked — night in progress")
  ).toBeVisible();
  // The banner has to name the way out, not just refuse.
  await expect(
    adminPage.getByText(
      "Applying is only allowed during Setup. Reset Game from the overrides panel on /host to unlock."
    )
  ).toBeVisible();

  await adminPage.close();

  // Leave the room in SETUP for whatever runs next.
  const restorePage = await context.newPage();
  await restoreSetupPhase(restorePage);

  await context.close();
});
