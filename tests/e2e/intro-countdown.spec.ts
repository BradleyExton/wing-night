import { expect, type Page, test } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup } from "./hostShell";

const COUNTDOWN_RECORD_KEY = "__wnCountdownRecord";

// `labels` exists so the countdown prefix keeps a POSITIVE assertion. It renders
// in a sibling node of the recorded digit, so the digit sequence alone cannot
// detect its removal — and host-display-sync.spec.ts uses that same copy as its
// countdown-settled sync gate, so losing it silently turns that spec into a race.
type CountdownRecord = { values: string[]; labels: string[] };

type CountdownRecordWindow = Window & {
  [COUNTDOWN_RECORD_KEY]?: CountdownRecord;
};

// Polling for a countdown digit is a sampling strategy against a 1-second window:
// each tick renders for COUNTDOWN_TICK_MS and never returns once passed, so one
// slow poll cycle on a contended machine misses the frame permanently. Recording
// instead of sampling removes the race — the ticks are chained (each timeout is
// scheduled by the effect that runs after the previous render commits), so a busy
// machine delays frames but can never skip one, and a MutationObserver fires on
// every committed render regardless of paint.
//
// Must be installed BEFORE the countdown starts; no countdown node exists during
// INTRO, so the first read is a no-op and the array fills from the opening tick.
const recordCountdownRenders = async (displayPage: Page): Promise<void> => {
  await displayPage.evaluate((recordKey) => {
    const record: CountdownRecord = { values: [], labels: [] };
    (window as CountdownRecordWindow)[recordKey] = record;

    const appendIfChanged = (into: string[], selector: string): void => {
      const text = document.querySelector(selector)?.textContent?.trim();

      // childList and characterData can both fire for a single commit.
      if (text !== undefined && text !== into[into.length - 1]) {
        into.push(text);
      }
    };

    // Reads the live DOM rather than the MutationRecords, so it samples on every
    // commit rather than intrinsically recording one. Safe because the ticks are
    // COUNTDOWN_TICK_MS (1s) apart — far wider than any coalescing window. If that
    // cadence ever approached zero, two commits could coalesce into one sample and
    // a dropped frame would read as green; record the MutationRecords if so.
    const readCountdown = (): void => {
      appendIfChanged(record.values, "[data-countdown-value]");
      appendIfChanged(record.labels, "[data-countdown-label]");
    };

    readCountdown();
    // document.body, not the nodes themselves: React unmounts and replaces them.
    new MutationObserver(readCountdown).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }, COUNTDOWN_RECORD_KEY);
};

const readCountdownRecord = async (
  displayPage: Page
): Promise<CountdownRecord> => {
  return displayPage.evaluate((recordKey) => {
    return (
      (window as CountdownRecordWindow)[recordKey] ?? { values: [], labels: [] }
    );
  }, COUNTDOWN_RECORD_KEY);
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
  await lockTeamsFromSetup(hostPage);

  await expect(hostPage.getByText("Game Locked In")).toBeVisible();
  await expect(hostPage.getByRole("button", { name: "Start Game" })).toBeVisible();

  await expect(displayPage.getByText("Locked In")).toBeVisible();
  await expect(
    displayPage.getByText("Host is ready to launch the round.")
  ).toBeVisible();

  await recordCountdownRenders(displayPage);

  await hostPage.getByRole("button", { name: "Start Game" }).click();

  // The record is append-only, so polling it is race-free in a way polling the
  // DOM is not: a poll arriving after the countdown has finished still sees the
  // whole history. This asserts the countdown started, rendered its prefix, and
  // counted down in order.
  await expect
    .poll(() => readCountdownRecord(displayPage), { timeout: 10_000 })
    .toEqual({ values: ["3", "2", "1"], labels: ["Game starts in"] });

  // Terminal state, not a per-frame window. This bound is fail-safe: a countdown
  // that breaks either never terminates (red at any bound) or terminates without
  // ticking (caught by the frame sequence above), so a generous bound cannot hide
  // a regression — it only stops contention from inventing one.
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0, {
    timeout: 10_000
  });

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
