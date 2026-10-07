import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TriviaMinigamePlayerView } from "@wingnight/shared";

import { PlayerTriviaSurface } from "./index.js";

const card = (overrides: Partial<TriviaMinigamePlayerView> = {}): TriviaMinigamePlayerView => ({
  minigame: "TRIVIA",
  promptId: "mc-1",
  question: "Which pepper is hottest?",
  choices: ["Jalapeño", "Carolina Reaper", "Poblano"],
  status: "open",
  choiceIndex: null,
  isCorrect: null,
  ...overrides
});

const render = (view: TriviaMinigamePlayerView): string =>
  renderToStaticMarkup(<PlayerTriviaSurface minigamePlayerView={view} onDispatchAction={(): void => {}} />);

test("does light only the phone's own pick when it has chosen", () => {
  const html = render(card({ choiceIndex: 1 }));

  assert.match(html, /data-phone-answer-status="open"/);
  assert.equal(html.match(/aria-pressed="true"/g)?.length, 1);
  assert.match(html, /aria-pressed="true" data-phone-answer-option="1"/);
});

test("does say whether the pick was right when the host reveals the question", () => {
  assert.match(render(card({ status: "locked", choiceIndex: 1, isCorrect: true })), /✓ You got it/);
  assert.match(render(card({ status: "locked", choiceIndex: 0, isCorrect: false })), /✗ Not this time/);
});

test("does say the host is judging aloud when the question has no choices", () => {
  const html = render(card({ choices: null, status: "locked" }));

  assert.match(html, /data-phone-answer-status="spoken"/);
  assert.doesNotMatch(html, /<button/);
});
