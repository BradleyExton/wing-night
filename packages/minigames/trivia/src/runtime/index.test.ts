import assert from "node:assert/strict";
import test from "node:test";

import type { TriviaContentFile } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { triviaMinigameId, triviaRuntimePlugin, type TriviaRuntimeState } from "./index.js";
import { parseTriviaContentFile } from "./content/index.js";
import { isTriviaRules } from "./rules/index.js";

const triviaContentFixture: TriviaContentFile = {
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
  overrides: Partial<{
    teamIds: string[];
    activeRoundTeamId: string | null;
    pointsMax: number;
    pendingPointsByTeamId: Record<string, number>;
    rules: SerializableValue | null;
    content: SerializableValue | null;
  }> = {}
): TriviaRuntimeState => {
  const state = triviaRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined
        ? null
        : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules === undefined ? { questionsPerTurn: 3 } : overrides.rules,
    content:
      overrides.content === undefined ? triviaContentFixture : overrides.content
  });

  assert.notEqual(state, null);
  return state as TriviaRuntimeState;
};

const recordAttempt = (
  state: SerializableValue,
  isCorrect: boolean,
  options: Partial<{
    pointsMax: number;
    content: SerializableValue | null;
  }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return triviaRuntimePlugin.reduceAction({
    state,
    envelope: { actionType: "recordAttempt", actionPayload: { isCorrect } },
    pointsMax: options.pointsMax ?? 15,
    rules: null,
    content:
      options.content === undefined ? triviaContentFixture : options.content
  });
};

test("init creates stable turn order with empty pending points", () => {
  const state = initializeState();

  assert.equal(triviaMinigameId, "TRIVIA");
  assert.deepEqual(state.runtimeState.turnOrderTeamIds, ["team-1", "team-2"]);
  assert.equal(state.runtimeState.activeTurnIndex, 0);
  assert.equal(state.runtimeState.promptCursor, 0);
  assert.deepEqual(state.runtimeState.pendingPointsByTeamId, {});
  assert.equal(state.attemptsUsedThisTurn, 0);
  assert.equal(state.questionsPerTurnLimit, 3);
});

test("initialize collapses the turn order to the active round team", () => {
  const state = initializeState({ activeRoundTeamId: "team-2" });

  assert.deepEqual(state.runtimeState.turnOrderTeamIds, ["team-2"]);
});

test("reduce rotates turns and advances prompts", () => {
  const firstState = initializeState();

  const second = recordAttempt(firstState, true);
  const secondState = second.state as TriviaRuntimeState;

  assert.equal(second.didMutate, true);
  assert.equal(secondState.runtimeState.activeTurnIndex, 1);
  assert.equal(secondState.runtimeState.promptCursor, 1);
  assert.equal(secondState.runtimeState.pendingPointsByTeamId["team-1"], 1);

  const third = recordAttempt(second.state, false);
  const thirdState = third.state as TriviaRuntimeState;

  assert.equal(thirdState.runtimeState.activeTurnIndex, 0);
  assert.equal(thirdState.runtimeState.promptCursor, 0);
  assert.equal(thirdState.runtimeState.pendingPointsByTeamId["team-1"], 1);
  assert.equal(thirdState.runtimeState.pendingPointsByTeamId["team-2"], undefined);
});

test("reduce enforces scoring cap", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-1": 15 } });

  const next = recordAttempt(state, true);
  const nextState = next.state as TriviaRuntimeState;

  assert.equal(nextState.runtimeState.pendingPointsByTeamId["team-1"], 15);
});

test("reduce stops once the questions-per-turn limit is spent", () => {
  const state = initializeState({ rules: { questionsPerTurn: 1 } });

  const first = recordAttempt(state, true);
  assert.equal(first.didMutate, true);

  const blocked = recordAttempt(first.state, true);
  assert.equal(blocked.didMutate, false);
});

test("reduce ignores unknown actions, malformed payloads, and foreign state", () => {
  const state = initializeState();

  assert.equal(
    triviaRuntimePlugin.reduceAction({
      state,
      envelope: { actionType: "unknownAction", actionPayload: { isCorrect: true } },
      pointsMax: 15,
      rules: null,
      content: triviaContentFixture
    }).didMutate,
    false
  );
  assert.equal(
    triviaRuntimePlugin.reduceAction({
      state,
      envelope: { actionType: "recordAttempt", actionPayload: { isCorrect: "yes" } },
      pointsMax: 15,
      rules: null,
      content: triviaContentFixture
    }).didMutate,
    false
  );
  assert.equal(recordAttempt("not-a-trivia-state", true).didMutate, false);
});

test("selectDisplayView omits prompt answer while host view includes it", () => {
  const state = initializeState();

  const hostView = triviaRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: triviaContentFixture
  });
  const displayView = triviaRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: triviaContentFixture
  });

  assert.equal(hostView?.minigame, "TRIVIA");
  assert.equal(
    hostView?.minigame === "TRIVIA" ? hostView.currentPrompt?.answer : null,
    "Answer 1"
  );
  assert.equal(displayView?.minigame, "TRIVIA");
  assert.deepEqual(
    displayView?.minigame === "TRIVIA" ? displayView.currentPrompt : null,
    {
      id: "prompt-1",
      question: "Question 1?"
    }
  );
  assert.equal(JSON.stringify(displayView).includes("Answer 1"), false);
});

test("syncPendingPoints replaces the pending points map", () => {
  const state = initializeState();
  const synced = triviaRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 7 }
  }) as TriviaRuntimeState;

  assert.deepEqual(synced.runtimeState.pendingPointsByTeamId, { "team-1": 7 });
});

test("syncContent clamps the prompt cursor when the content shrinks", () => {
  const state = initializeState();
  const advanced = recordAttempt(state, true).state as TriviaRuntimeState;

  assert.equal(advanced.runtimeState.promptCursor, 1);

  const synced = triviaRuntimePlugin.syncContent?.({
    state: advanced,
    rules: null,
    content: { prompts: [triviaContentFixture.prompts[0]] }
  }) as TriviaRuntimeState;

  assert.equal(synced.runtimeState.promptCursor, 0);
});

test("isTriviaRules accepts positive integer questionsPerTurn only", () => {
  assert.equal(isTriviaRules({ questionsPerTurn: 3 }), true);
  assert.equal(isTriviaRules({ questionsPerTurn: 0 }), false);
  assert.equal(isTriviaRules({ questionsPerTurn: 1.5 }), false);
  assert.equal(isTriviaRules({}), false);
  assert.equal(isTriviaRules(null), false);
});

test("parseTriviaContentFile rejects malformed content files", () => {
  assert.throws(
    () => parseTriviaContentFile("not json", "trivia.json"),
    /Failed to parse trivia content/
  );
  assert.throws(
    () => parseTriviaContentFile("{}", "trivia.json"),
    /Invalid trivia content at "trivia.json": expected \{ prompts: \[\{ id, question, answer \}\] \}\./
  );

  const parsed = parseTriviaContentFile(
    JSON.stringify(triviaContentFixture),
    "trivia.json"
  );

  assert.equal(parsed.prompts.length, 2);
  assert.equal(parsed.prompts[0].id, "prompt-1");
});
