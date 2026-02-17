import assert from "node:assert/strict";
import test from "node:test";

import {
  createTriviaStateWithPendingPoints,
  triviaMinigameModule,
  type TriviaMinigameContext,
  type TriviaMinigameState
} from "./index.js";

const triviaContext: TriviaMinigameContext = {
  prompts: [
    {
      id: "prompt-1",
      question: "Question 1?",
      answer: "Answer 1"
    },
    {
      id: "prompt-2",
      question: "Question 2?",
      answer: "Answer 2"
    }
  ]
};

const initializeState = (
  stateOverrides: Partial<TriviaMinigameState> = {}
): TriviaMinigameState => {
  const initialized = triviaMinigameModule.init({
    teamIds: ["team-1", "team-2"],
    pointsMax: 15,
    context: triviaContext
  });

  return {
    ...initialized,
    ...stateOverrides
  };
};

test("init creates stable turn order with empty pending points", () => {
  const state = triviaMinigameModule.init({
    teamIds: ["team-1", "team-2"],
    pointsMax: 15,
    context: triviaContext
  });

  assert.deepEqual(state.turnOrderTeamIds, ["team-1", "team-2"]);
  assert.equal(state.activeTurnIndex, 0);
  assert.equal(state.promptCursor, 0);
  assert.deepEqual(state.pendingPointsByTeamId, {});
});

test("reduce rotates turns and advances prompts", () => {
  const firstState = initializeState();

  const secondState = triviaMinigameModule.reduce({
    teamIds: ["team-1", "team-2"],
    pointsMax: 15,
    context: triviaContext,
    state: firstState,
    action: {
      type: "recordAttempt",
      isCorrect: true
    }
  });

  assert.equal(secondState.activeTurnIndex, 1);
  assert.equal(secondState.promptCursor, 1);
  assert.equal(secondState.pendingPointsByTeamId["team-1"], 1);

  const thirdState = triviaMinigameModule.reduce({
    teamIds: ["team-1", "team-2"],
    pointsMax: 15,
    context: triviaContext,
    state: secondState,
    action: {
      type: "recordAttempt",
      isCorrect: false
    }
  });

  assert.equal(thirdState.activeTurnIndex, 0);
  assert.equal(thirdState.promptCursor, 0);
  assert.equal(thirdState.pendingPointsByTeamId["team-1"], 1);
  assert.equal(thirdState.pendingPointsByTeamId["team-2"], undefined);
});

test("reduce enforces scoring cap", () => {
  const stateWithPendingPoints = createTriviaStateWithPendingPoints(
    initializeState(),
    { "team-1": 15 }
  );

  const nextState = triviaMinigameModule.reduce({
    teamIds: ["team-1", "team-2"],
    pointsMax: 15,
    context: triviaContext,
    state: stateWithPendingPoints,
    action: {
      type: "recordAttempt",
      isCorrect: true
    }
  });

  assert.equal(nextState.pendingPointsByTeamId["team-1"], 15);
});

test("selectDisplayView omits prompt answer while host view includes it", () => {
  const state = initializeState();

  const hostView = triviaMinigameModule.selectHostView({
    state,
    context: triviaContext
  });
  const displayView = triviaMinigameModule.selectDisplayView({
    state,
    context: triviaContext
  });

  assert.equal(hostView.currentPrompt?.answer, "Answer 1");
  assert.deepEqual(displayView.currentPrompt, {
    id: "prompt-1",
    question: "Question 1?"
  });
});
