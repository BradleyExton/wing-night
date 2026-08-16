import { expect, type Page, test } from "@playwright/test";

import { ensureSetupPhase, lockTeamsFromSetup } from "./hostShell";

const COUNTDOWN_FRAMES_KEY = "__wnCountdownFrames";

type CountdownFrameWindow = Window & { [COUNTDOWN_FRAMES_KEY]?: string[] };

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
const recordCountdownFrames = async (displayPage: Page): Promise<void> => {
  await displayPage.evaluate((framesKey) => {
    const frames: string[] = [];
    (window as CountdownFrameWindow)[framesKey] = frames;

    const readCountdownValue = (): void => {
      const value = document
        .querySelector("[data-countdown-value]")
        ?.textContent?.trim();

      // childList and characterData can both fire for a single commit.
      if (value !== undefined && value !== frames[frames.length - 1]) {
        frames.push(value);
      }
    };

    readCountdownValue();
    // document.body, not the node itself: React unmounts and replaces it.
    new MutationObserver(readCountdownValue).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }, COUNTDOWN_FRAMES_KEY);
};

const readCountdownFrames = async (displayPage: Page): Promise<string[]> => {
  return displayPage.evaluate((framesKey) => {
    return (window as CountdownFrameWindow)[framesKey] ?? [];
  }, COUNTDOWN_FRAMES_KEY);
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

  await recordCountdownFrames(displayPage);

  await hostPage.getByRole("button", { name: "Start Game" }).click();

  // The recorded frames are append-only, so polling them is race-free in a way
  // polling the DOM is not: a poll that arrives after the countdown has finished
  // still sees the whole history. This is the assertion that the countdown both
  // started and counted down, in order.
  await expect
    .poll(() => readCountdownFrames(displayPage), { timeout: 10_000 })
    .toEqual(["3", "2", "1"]);

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
