import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { marqueeBulbs } from "@wingnight/surface";
import type { TriviaMinigameDisplayView } from "@wingnight/shared";

import { DisplayTriviaSurface } from "./index.js";

const QUESTION = "What country is widely credited as the origin of hot sauce?";

const playView = (attemptsRemaining: number): TriviaMinigameDisplayView => ({
  minigame: "TRIVIA",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 2 },
  promptCursor: 0,
  attemptsRemaining,
  currentPrompt: { id: "prompt-1", question: QUESTION }
});

const renderSurface = (
  minigameDisplayView: TriviaMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <DisplayTriviaSurface
      phase={phase}
      minigameType="TRIVIA"
      minigameDisplayView={minigameDisplayView}
      activeTeamName="Molten Metal"
      serverOrigin="http://localhost:3000"
    />
  );
};

test("puts the question and its rule on the stage", () => {
  const html = renderSurface(playView(3));

  assert.match(html, new RegExp(QUESTION));
});

// Every other display marquee hangs the dotted bulb ring inside its gold
// border; three of them were copied without it and had it restored at T5.2.
// A new marquee arriving without one would recreate that bug exactly.
test("does hang the shared bulb ring on the marquee", () => {
  assert.ok(renderSurface(playView(3)).includes(marqueeBulbs));
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
