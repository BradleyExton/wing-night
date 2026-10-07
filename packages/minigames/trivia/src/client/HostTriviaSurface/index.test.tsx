import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TriviaMinigameHostView } from "@wingnight/shared";

import { HostTriviaSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const hostView = (
  overrides: Partial<TriviaMinigameHostView> = {}
): TriviaMinigameHostView => ({
  minigame: "TRIVIA",
  activeTurnTeamId: "team-1",
  attemptsRemaining: 3,
  promptCursor: 0,
  pendingPointsByTeamId: { "team-1": 2 },
  currentPrompt: {
    id: "spice-origin",
    question: "What country is credited with hot sauce?",
    answer: "Mexico"
  },
  phoneAnswers: null,
  reveal: null,
  ...overrides
});

// The shell's chrome, as markers: this surface never draws either one, it
// forwards both into the layout's slots.
const rail = <span data-slot="rail" />;

const renderSurface = (
  view: TriviaMinigameHostView | null,
  phase: "intro" | "play" = "play",
  clock: JSX.Element | null = null
): string => {
  return renderToStaticMarkup(
    <HostTriviaSurface
      phase={phase}
      minigameType="TRIVIA"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      rail={phase === "play" ? rail : null}
      clock={phase === "play" ? clock : null}
      canDispatchAction
      onDispatchAction={(): void => {}}
      serverOrigin={null}
      seat="host"
      handset="tablet"
    />
  );
};

test("does forward the shell's rail into the takeover's rail row when playing", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div>/);
  // The rail is the shell's `<header>`; the game adds no landmark of its own.
  assert.doesNotMatch(html, /<(?:header|nav|main|section|aside|footer)\b/);
});

// §6: the reserve for a chip that may not draw is a flex row, not a padding.
// TRIVIA is host-paced (`timerKey: null`), so its clock slot is permanently
// empty — and an empty slot has to leave nothing behind, not even a gap.
test("does leave nothing in the rail row for the clock when the game is host-paced", () => {
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /<div[^>]*><\/div>/);
  assert.doesNotMatch(html, /pr-\[clamp\(9rem/);
});

// §4: the rail already says whose turn it is, and saying it twice on one
// canvas is the duplication this migration removes. The helper that resolved
// it — copy-pasted verbatim into all nine host surfaces — went with it.
test("does not repeat the active team name that the rail already carries", () => {
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /Team Heat/);
});

test("does put the questions-left count in the rail row's counter slot", () => {
  const html = renderSurface(hostView({ attemptsRemaining: 2 }));

  assert.match(html, /2 questions left/);
  // Rail row first, body after: the counter is chrome, not content.
  assert.ok(html.indexOf("2 questions left") < html.indexOf("What country"));
});

test("does render the positive verdict before the negative one", () => {
  const html = renderSurface(hostView());

  assert.ok(html.indexOf("Correct") < html.indexOf("Incorrect"));
});

// The live bug this migration fixes: `INCORRECT` was the right-hand cell of a
// grid running to the canvas edge, under the dock's 48px circle. The gutter is
// now the layout's — `actions` in `@wingnight/surface` carries `pr-[4.5rem]`
// — and the game's own styles carry no reserve at all.
test("does take the dock gutter from the layout rather than from its own styles", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="shrink-0 pr-\[4\.5rem\]">/);
  assert.ok(
    html.indexOf('class="shrink-0 pr-[4.5rem]"') < html.indexOf("Incorrect")
  );
});

test("does replace the verdicts with the turn-complete panel when the attempts are spent", () => {
  const html = renderSurface(hostView({ attemptsRemaining: 0 }));

  assert.match(html, /Turn complete/);
  assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(html, /questions left/);
});

test("does fill the body with the question card when playing", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="relative isolate min-h-0 min-w-0 flex-1"><div class="[^"]*h-full/);
});

// The intro beat is a panel in the host's control deck, not a takeover: the
// host peeks at the turn's first question, the shell's deck holds the chrome,
// and the card falls back to its own content height.
test("does render the card without takeover chrome or verdicts at intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /What country is credited with hot sauce\?/);
  assert.match(html, /Review the active team/);
  assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(html, /questions left/);
  assert.doesNotMatch(html, /h-full/);
});

test("does show the waiting note and disabled verdicts when the bank is empty", () => {
  const html = renderSurface(hostView({ currentPrompt: null }));

  assert.match(html, /Waiting for the next trivia prompt\./);
  assert.match(html, /<button[^>]*disabled/);
});

const choicePrompt = {
  id: "spice-origin",
  question: "What country is credited with hot sauce?",
  answer: "Mexico",
  choices: ["India", "Mexico", "Thailand"]
};

test("does offer the lock with the phones' count and keep the spoken verdicts when the team's phones are choosing", () => {
  const html = renderSurface(
    hostView({
      currentPrompt: choicePrompt,
      phoneAnswers: { answeredCount: 1, seatedCount: 2 }
    })
  );

  assert.match(html, /Lock answers · 1 of 2 in/);
  assert.match(html, /data-trivia-host-tally="1\/2"/);
  assert.match(html, />Correct</);
  assert.match(html, />Incorrect</);
  // The host's key: every choice, the answer ticked.
  assert.match(html, /data-trivia-host-choices/);
  assert.match(html, /Thailand/);
});

test("does keep today's verdicts alone when nobody on the team has a phone", () => {
  const html = renderSurface(hostView({ currentPrompt: choicePrompt, phoneAnswers: null }));

  assert.doesNotMatch(html, /Lock answers/);
  assert.match(html, />Correct</);
});

test("does offer the next question and the spread's counts when the question is locked", () => {
  const html = renderSurface(
    hostView({
      currentPrompt: choicePrompt,
      reveal: {
        promptId: "spice-origin",
        choices: choicePrompt.choices,
        choiceCounts: [0, 2, 0],
        correctIndex: 1,
        correctCount: 2,
        answeredCount: 2,
        seatedCount: 2,
        pointsAwarded: 1
      }
    })
  );

  assert.match(html, /Next question/);
  assert.doesNotMatch(html, />Correct</);
});
