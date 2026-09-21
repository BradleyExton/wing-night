import { expect, type Page, test } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup } from "./hostShell";

const COUNTDOWN_RECORD_KEY = "__wnCountdownRecord";

// `labels` exists so the countdown prefix keeps a POSITIVE assertion. It renders
// in a sibling node of the recorded digit, so the digit sequence alone cannot
// detect its removal — and host-display-sync.spec.ts uses that same copy as its
// countdown-settled sync gate, so losing it silently turns that spec into a race.
//
// `briefingDigits` is the whole point of counting in on the WAITING screen: it
// collects every digit that was on screen while the first team's briefing was
// also up. The count-in holds the phase back, so the team enters on zero and
// this must stay empty — a regression that starts the round first and counts in
// over the top of it fills it.
type CountdownRecord = {
  values: string[];
  labels: string[];
  briefingDigits: string[];
};

type CountdownRecordWindow = Window & {
  [COUNTDOWN_RECORD_KEY]?: CountdownRecord;
};

// Polling for a countdown digit is a sampling strategy against a 1-second window:
// each digit holds for about a second and never returns once passed, so one slow
// poll cycle on a contended machine misses the frame permanently. Recording
// instead of sampling removes the race — the digit is a reading of the server's
// own end instant, polled far faster than it changes, so a busy machine renders
// a frame late but never skips one, and a MutationObserver fires on every
// committed render regardless of paint.
//
// Must be installed BEFORE the host taps Start Game; no countdown node exists
// until the count-in is armed, so the first read is a no-op and the arrays fill
// from the opening tick.
const recordCountdownRenders = async (displayPage: Page): Promise<void> => {
  await displayPage.evaluate((recordKey) => {
    const record: CountdownRecord = { values: [], labels: [], briefingDigits: [] };
    (window as CountdownRecordWindow)[recordKey] = record;

    const appendIfChanged = (into: string[], selector: string): void => {
      const text = document.querySelector(selector)?.textContent?.trim();

      // childList and characterData can both fire for a single commit.
      if (text !== undefined && text !== into[into.length - 1]) {
        into.push(text);
      }
    };

    // Reads the live DOM rather than the MutationRecords, so it samples on every
    // commit rather than intrinsically recording one. Safe because the digit only
    // changes once a second — far wider than any coalescing window. If that
    // cadence ever approached zero, two commits could coalesce into one sample and
    // a dropped frame would read as green; record the MutationRecords if so.
    const readCountdown = (): void => {
      appendIfChanged(record.values, "[data-countdown-value]");
      appendIfChanged(record.labels, "[data-countdown-label]");

      const digit = document
        .querySelector("[data-countdown-value]")
        ?.textContent?.trim();

      if (digit !== undefined && document.querySelector("[data-team-briefing]")) {
        record.briefingDigits.push(digit);
      }
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
      (window as CountdownRecordWindow)[recordKey] ?? {
        values: [],
        labels: [],
        briefingDigits: []
      }
    );
  }, COUNTDOWN_RECORD_KEY);
};

test("intro lock screen counts the room in before the first team enters", async ({
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

  // The tablet carries the same count-in the room is watching, and the tap is
  // not a phase advance: the host stays on the pre-game rail until zero.
  await expect(hostPage.getByRole("button", { name: /^Starting in/ })).toBeVisible();
  await expect(
    hostPage.getByRole("button", { name: "Start Eating" })
  ).toHaveCount(0);

  // The record is append-only, so polling it is race-free in a way polling the
  // DOM is not: a poll arriving after the countdown has finished still sees the
  // whole history. This asserts the countdown started, rendered its prefix,
  // counted down in order, and never ran over the first team's briefing.
  await expect
    .poll(() => readCountdownRecord(displayPage), { timeout: 10_000 })
    .toEqual({
      values: ["3", "2", "1"],
      labels: ["Game starts in"],
      briefingDigits: []
    });

  // Terminal state, not a per-frame window. This bound is fail-safe: a countdown
  // that breaks either never terminates (red at any bound) or terminates without
  // ticking (caught by the frame sequence above), so a generous bound cannot hide
  // a regression — it only stops contention from inventing one.
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0, {
    timeout: 10_000
  });

  await expect(
    hostPage.getByRole("button", { name: "Start Eating" })
  ).toBeVisible();
  await expect(hostPage.locator("header").getByText("Round 1 of 6")).toBeVisible();
  await expect(hostPage.getByText("Game starts in")).toHaveCount(0);

  // The count-in hands straight over to the first team's briefing — which only
  // now begins, with its anthem, on a screen of its own. The host rail carries
  // the round's sauce and mini-game the round intro used to.
  await expect(displayPage.getByText("on the wings")).toBeVisible();
  await expect(displayPage.getByText("Game starts in")).toHaveCount(0);
  await expect(hostPage.locator("header").getByText("Frank's")).toBeVisible();
  await expect(displayPage.getByText("SCHLONIC")).toBeVisible();

  await context.close();
});
