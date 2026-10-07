import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ReactNode } from "react";

import type { TriviaMinigameDisplayView } from "@wingnight/shared";

import { DisplayTriviaSurface } from "./index.js";

const QUESTION = "What country is widely credited as the origin of hot sauce?";

const playView = (attemptsRemaining: number): TriviaMinigameDisplayView => ({
  minigame: "TRIVIA",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 2 },
  promptCursor: 0,
  attemptsRemaining,
  currentPrompt: { id: "prompt-1", question: QUESTION, choices: null },
  phoneAnswers: null,
  reveal: null
});

const renderSurface = (
  minigameDisplayView: TriviaMinigameDisplayView | null,
  phase: "intro" | "play" = "play",
  clock: ReactNode = null
): string => {
  return renderToStaticMarkup(
    <DisplayTriviaSurface
      phase={phase}
      minigameType="TRIVIA"
      minigameDisplayView={minigameDisplayView}
      activeTeamName="Molten Metal"
      clock={clock}
      handset="tablet"

      clockLine={null}
      serverOrigin="http://localhost:3000"
    />
  );
};

test("puts the question and its rule on the stage", () => {
  const html = renderSurface(playView(3));

  assert.match(html, new RegExp(QUESTION));
});

// ADR-0006: the marquee is one shared component, not a container each game
// copies and a ring each copy could forget. This pins that the surface hangs
// THAT sign and not a private one — the drift the bulb-ring test used to catch.
test("does hang the shared neon marquee", () => {
  assert.ok(renderSurface(playView(3)).includes("data-neon-marquee"));
});

test("names the active team and the show on the marquee", () => {
  const html = renderSurface(playView(3));

  assert.match(html, /Molten Metal/);
  assert.match(html, /Trivia/);
});

// The team used to be named a second time under the question, as "On the
// clock: MOLTEN METAL". The marquee says it now, and saying it twice on one
// canvas is what this migration exists to remove.
test("names the team once, not under the question as well", () => {
  const html = renderSurface(playView(3));

  assert.equal(html.match(/Molten Metal/g)?.length, 1);
  assert.doesNotMatch(html, /On the clock/);
});

// TRIVIA is host-paced and the TV has no clock, so the budget is the room's
// only sign of how much turn is left.
test("counts the questions the team has left", () => {
  assert.match(renderSurface(playView(3)), /3 questions to go/);
  assert.match(renderSurface(playView(1)), /1 question to go/);
});

test("says the turn is over once the budget is spent", () => {
  const html = renderSurface(playView(0));

  assert.match(html, /Turn complete/);
  assert.doesNotMatch(html, /to go/);
  // The last question stays on the wall; only the counter changes.
  assert.match(html, new RegExp(QUESTION));
});

test("falls back to a waiting note before the first prompt arrives", () => {
  assert.match(renderSurface(null), /Waiting for trivia prompt/);
});

test("shows only the get-ready note during the minigame intro", () => {
  const html = renderSurface(null, "intro");

  assert.match(html, /Get ready/);
  assert.doesNotMatch(html, /Molten Metal/);
});

// docs/takeover-layout-api.md §6, the TV's half of it (T5.3). TRIVIA is
// `timerKey: null`, so the shell's clock renders nothing here — and the
// marquee used to hold `pr-[clamp(8rem,14vw,18rem)]` of dead width against a
// chip that has never once drawn on this surface. The reserve is gone because
// the clock is a flex item: an absent one contributes no child and costs no
// width. A hand-typed reserve creeping back in is the exact bug.
test("reserves no width in the marquee for a clock this game never gets", () => {
  const html = renderSurface(playView(3));

  assert.doesNotMatch(html, /pr-\[clamp\(/);
});

// The other half of the inversion: the slot is honoured, so a game that DID
// get a clock would draw it in the marquee's meta cell rather than under a
// chip pinned over the corner. Dropping `{clock}` from the marquee would make
// the six clock-less surfaces look fine and silently blind the three that have
// one, which is how this went wrong the first time.
test("puts the shell's clock in the marquee's meta cell when there is one", () => {
  const html = renderSurface(playView(3), "play", <span>0:45</span>);

  assert.match(html, /<span>0:45<\/span>/);
  assert.match(html, /3 questions to go[\s\S]*0:45/);
});

const CHOICES = ["Mexico", "India", "Thailand"];

const choiceView = (overrides: Partial<TriviaMinigameDisplayView> = {}): TriviaMinigameDisplayView => ({
  ...playView(3),
  currentPrompt: { id: "prompt-1", question: QUESTION, choices: CHOICES },
  phoneAnswers: { answeredCount: 2, seatedCount: 3 },
  ...overrides
});

test("does show the choices and the phones' count but no answer when the phones are choosing", () => {
  const html = renderSurface(choiceView());

  for (const choice of CHOICES) {
    assert.match(html, new RegExp(choice));
  }

  assert.match(html, /data-trivia-phone-tally="2\/3"/);
  assert.match(html, /2 of 3 in/);
  assert.doesNotMatch(html, /The answer/);
  assert.doesNotMatch(html, /data-trivia-spread/);
});

test("does draw the spread with the answer marked in words when the host reveals the question", () => {
  const html = renderSurface(
    choiceView({
      phoneAnswers: null,
      reveal: {
        promptId: "prompt-1",
        choices: CHOICES,
        choiceCounts: [2, 1, 0],
        correctIndex: 0,
        correctCount: 2,
        answeredCount: 3,
        seatedCount: 3,
        pointsAwarded: 1
      }
    })
  );

  assert.match(html, /data-trivia-spread-choice="0" data-trivia-spread-count="2" data-trivia-spread-answer="true"/);
  assert.match(html, /data-trivia-spread-choice="1" data-trivia-spread-count="1" data-trivia-spread-answer="false"/);
  assert.match(html, /✓ The answer/);
  assert.match(html, /2 of 3 got it/);
  assert.match(html, /data-result-plaque/);
  assert.match(html, /\+1/);
});
