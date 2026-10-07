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
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId: string | null;
    pointsMax: number;
    pendingPointsByTeamId: Record<string, number>;
    rules: SerializableValue | null;
    content: SerializableValue | null;
  }> = {}
): TriviaRuntimeState => {
  const state = triviaRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
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

test("reduce holds the prompt cursor on the verdict that ends the turn", () => {
  const state = initializeState({ rules: { questionsPerTurn: 2 } });

  const first = recordAttempt(state, true);
  const firstState = first.state as TriviaRuntimeState;

  assert.equal(firstState.runtimeState.promptCursor, 1);

  const last = recordAttempt(first.state, true);
  const lastState = last.state as TriviaRuntimeState;

  assert.equal(last.didMutate, true);
  assert.equal(lastState.attemptsUsedThisTurn, 2);
  // The question the last verdict scored stays up; the next one belongs to the
  // next team and must not reach the TV, or its answer the host tablet.
  assert.equal(lastState.runtimeState.promptCursor, 1);

  const hostView = triviaRuntimePlugin.selectHostView({
    state: lastState,
    rules: null,
    content: triviaContentFixture
  });

  assert.equal(
    hostView?.minigame === "TRIVIA" ? hostView.currentPrompt?.id : null,
    "prompt-2"
  );
});

test("reduce refuses an attempt when the prompt bank is empty", () => {
  const state = initializeState({ content: { prompts: [] } });

  const attempt = recordAttempt(state, true, { content: { prompts: [] } });
  const attemptState = attempt.state as TriviaRuntimeState;

  assert.equal(attempt.didMutate, false);
  assert.equal(attemptState.attemptsUsedThisTurn, 0);
  assert.deepEqual(attemptState.runtimeState.pendingPointsByTeamId, {});
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
      question: "Question 1?",
      choices: null
    }
  );
  assert.equal(JSON.stringify(displayView).includes("Answer 1"), false);
});

// The TV has no clock for a host-paced game, so the count reaching zero is the
// room's only sign that the last question on screen is nobody's to answer.
test("selectDisplayView counts the turn's questions down to zero", () => {
  let state: SerializableValue = initializeState();

  const attemptsRemainingOf = (current: SerializableValue): number | null => {
    const displayView = triviaRuntimePlugin.selectDisplayView({
      state: current,
      rules: null,
      content: triviaContentFixture
    });

    return displayView?.minigame === "TRIVIA" ? displayView.attemptsRemaining : null;
  };

  assert.equal(attemptsRemainingOf(state), 3);

  state = recordAttempt(state, true).state;
  assert.equal(attemptsRemainingOf(state), 2);

  state = recordAttempt(state, false).state;
  state = recordAttempt(state, true).state;
  assert.equal(attemptsRemainingOf(state), 0);
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
    /Invalid trivia content at "trivia.json": expected \{ prompts: \[\{ id, question, answer, choices\? \}\] \}/
  );

  const parsed = parseTriviaContentFile(
    JSON.stringify(triviaContentFixture),
    "trivia.json"
  );

  assert.equal(parsed.prompts.length, 2);
  assert.equal(parsed.prompts[0].id, "prompt-1");
});

test("initialize seeds the prompt cursor by team index so later teams get fresh questions", () => {
  const seededContent = {
    prompts: [
      { id: "prompt-1", question: "Question 1?", answer: "Answer 1" },
      { id: "prompt-2", question: "Question 2?", answer: "Answer 2" },
      { id: "prompt-3", question: "Question 3?", answer: "Answer 3" },
      { id: "prompt-4", question: "Question 4?", answer: "Answer 4" },
      { id: "prompt-5", question: "Question 5?", answer: "Answer 5" }
    ]
  };
  const initializeForTeam = (
    activeRoundTeamId: string | null,
    content: SerializableValue = seededContent
  ): TriviaRuntimeState => {
    return initializeState({
      teamIds: ["team-1", "team-2", "team-3"],
      // This game never looks at the roster; JOUST is the one that does.
      players: [],
      teams: [],
      activeRoundTeamId,
      rules: { questionsPerTurn: 2 },
      content
    });
  };

  assert.equal(initializeForTeam("team-1").runtimeState.promptCursor, 0);
  assert.equal(initializeForTeam("team-2").runtimeState.promptCursor, 2);
  assert.equal(initializeForTeam("team-3").runtimeState.promptCursor, 4);
  assert.equal(
    initializeForTeam("team-1", { prompts: [] }).runtimeState.promptCursor,
    0
  );
});

// --- Answers on the phones: a question with choices is answered on every seated phone at once. ---

const choiceContent: TriviaContentFile = {
  prompts: [
    {
      id: "mc-1",
      question: "Which pepper is hottest?",
      answer: "Carolina Reaper",
      choices: ["Jalapeño", "Carolina Reaper", "Poblano"]
    },
    { id: "spoken-1", question: "Name a hot sauce.", answer: "Frank's" },
    {
      id: "mc-2",
      question: "What measures heat?",
      answer: "Scoville scale",
      choices: ["Scoville scale", "Richter scale"]
    }
  ]
};

const seatedThree = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Caitlin" },
  { id: "player-3", name: "Dan" }
] as const;

const choiceState = (questionsPerTurn = 3): TriviaRuntimeState => {
  return initializeState({
    activeRoundTeamId: "team-1",
    rules: { questionsPerTurn },
    content: choiceContent
  });
};

const choose = (
  state: SerializableValue,
  playerId: string,
  actionPayload: SerializableValue,
  answeringPlayers: readonly { id: string; name: string }[] = seatedThree
): { state: SerializableValue; didMutate: boolean } => {
  const reducePlayerAction = triviaRuntimePlugin.reducePlayerAction;

  assert.ok(reducePlayerAction !== undefined);

  return reducePlayerAction({
    state,
    envelope: { actionType: "chooseAnswer", actionPayload },
    pointsMax: 15,
    rules: null,
    content: choiceContent,
    playerId,
    answeringPlayers
  });
};

const hostAction = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  options: Partial<{ pointsMax: number; answeringPlayers: readonly { id: string; name: string }[] }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return triviaRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: null,
    content: choiceContent,
    answeringPlayers: options.answeringPlayers ?? seatedThree
  });
};

const pendingOf = (state: SerializableValue): number => {
  return (state as TriviaRuntimeState).runtimeState.pendingPointsByTeamId["team-1"] ?? 0;
};

test("does take only chooseAnswer from a phone when the plugin lists its player actions", () => {
  assert.deepEqual(triviaRuntimePlugin.playerActionTypes, ["chooseAnswer"]);
  assert.equal(triviaRuntimePlugin.playerActionTypes?.includes("lockChoices"), false);
});

test("does accept a choice when it comes from a seated phone on the playing team", () => {
  const chosen = choose(choiceState(), "player-2", { choiceIndex: 1 });

  assert.equal(chosen.didMutate, true);
  assert.deepEqual((chosen.state as TriviaRuntimeState).choicesByPlayerId, { "player-2": 1 });
});

test("does refuse a choice when the sender is not seated, the index is off the list or malformed", () => {
  const state = choiceState();

  assert.equal(choose(state, "player-9", { choiceIndex: 0 }).didMutate, false);
  assert.equal(choose(state, "player-1", { choiceIndex: 3 }).didMutate, false);
  assert.equal(choose(state, "player-1", { choiceIndex: -1 }).didMutate, false);
  assert.equal(choose(state, "player-1", { choiceIndex: 1.5 }).didMutate, false);
  assert.equal(choose(state, "player-1", { choice: 1 }).didMutate, false);
});

test("does let a phone change its choice when the question is still open", () => {
  const first = choose(choiceState(), "player-1", { choiceIndex: 0 });
  const changed = choose(first.state, "player-1", { choiceIndex: 1 });

  assert.equal(changed.didMutate, true);
  assert.equal((changed.state as TriviaRuntimeState).choicesByPlayerId["player-1"], 1);
  assert.equal(choose(changed.state, "player-1", { choiceIndex: 1 }).didMutate, false);
});

test("does refuse a choice when the host has locked the question", () => {
  const chosen = choose(choiceState(), "player-1", { choiceIndex: 1 });
  const locked = hostAction(chosen.state, "lockChoices");

  assert.equal(locked.didMutate, true);
  assert.equal(choose(locked.state, "player-2", { choiceIndex: 1 }).didMutate, false);
  assert.equal(choose(locked.state, "player-1", { choiceIndex: 0 }).didMutate, false);
});

test("does refuse a choice when the question has no choices", () => {
  let state: SerializableValue = choiceState();

  state = hostAction(state, "recordAttempt", { isCorrect: false }).state;

  assert.equal((state as TriviaRuntimeState).runtimeState.promptCursor, 1);
  assert.equal(choose(state, "player-1", { choiceIndex: 0 }).didMutate, false);
  assert.equal(hostAction(state, "lockChoices").didMutate, false);
});

test("does score the share of seated phones that chose right when the host locks", () => {
  let state: SerializableValue = choiceState();

  // Two of three right: round(2/3) = 1 point.
  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = choose(state, "player-2", { choiceIndex: 1 }).state;
  state = choose(state, "player-3", { choiceIndex: 0 }).state;

  const locked = hostAction(state, "lockChoices").state as TriviaRuntimeState;

  assert.equal(pendingOf(locked), 1);
  assert.deepEqual(locked.reveal, {
    promptId: "mc-1",
    choices: ["Jalapeño", "Carolina Reaper", "Poblano"],
    choiceCounts: [1, 2, 0],
    correctIndex: 1,
    correctCount: 2,
    answeredCount: 3,
    seatedCount: 3,
    pointsAwarded: 1
  });
  assert.equal(locked.attemptsUsedThisTurn, 1);
  // The question stays on screen under its reveal.
  assert.equal(locked.runtimeState.promptCursor, 0);
});

test("does round the share half up and down when a third or a half of the team is right", () => {
  const scoreWith = (rightIds: string[], wrongIds: string[], seated: readonly { id: string; name: string }[]) => {
    let state: SerializableValue = choiceState();

    for (const playerId of rightIds) {
      state = choose(state, playerId, { choiceIndex: 1 }, seated).state;
    }

    for (const playerId of wrongIds) {
      state = choose(state, playerId, { choiceIndex: 2 }, seated).state;
    }

    return pendingOf(hostAction(state, "lockChoices", {}, { answeringPlayers: seated }).state);
  };

  // One of three right (0.33) rounds to nothing; one of two (0.5) rounds up to the point.
  assert.equal(scoreWith(["player-1"], ["player-2", "player-3"], seatedThree), 0);
  assert.equal(scoreWith(["player-1"], ["player-2"], [seatedThree[0], seatedThree[1]]), 1);
  // A seated phone that never answered counts against the share: one right of three seated.
  assert.equal(scoreWith(["player-1"], [], seatedThree), 0);
});

test("does refuse the lock when no phone has chosen yet", () => {
  const refused = hostAction(choiceState(), "lockChoices");

  assert.equal(refused.didMutate, false);
  // The spoken verdict is still there for it.
  assert.equal(pendingOf(hostAction(choiceState(), "recordAttempt", { isCorrect: true }).state), 1);
});

test("does clip the phones' point to the turn's cap when the team is already at the cap", () => {
  let state: SerializableValue = initializeState({
    activeRoundTeamId: "team-1",
    rules: { questionsPerTurn: 3 },
    content: choiceContent,
    pendingPointsByTeamId: { "team-1": 4 }
  });

  state = choose(state, "player-1", { choiceIndex: 1 }).state;

  const locked = hostAction(state, "lockChoices", {}, { pointsMax: 4, answeringPlayers: [seatedThree[0]] });

  assert.equal(pendingOf(locked.state), 4);
});

test("does count only the seated phones' choices when a face was let go before the lock", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = choose(state, "player-2", { choiceIndex: 0 }).state;

  const locked = hostAction(state, "lockChoices", {}, { answeringPlayers: [seatedThree[1]] })
    .state as TriviaRuntimeState;

  assert.deepEqual(locked.reveal?.choiceCounts, [1, 0, 0]);
  assert.equal(locked.reveal?.seatedCount, 1);
  assert.equal(pendingOf(locked), 0);
});

test("does move to the next question and clear the choices when the host moves on", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = hostAction(state, "lockChoices").state;
  // A spoken verdict on a locked question would score it twice.
  assert.equal(hostAction(state, "recordAttempt", { isCorrect: true }).didMutate, false);

  const next = hostAction(state, "nextQuestion").state as TriviaRuntimeState;

  assert.equal(next.runtimeState.promptCursor, 1);
  assert.deepEqual(next.choicesByPlayerId, {});
  assert.equal(next.reveal, null);
  assert.equal(hostAction(next, "nextQuestion").didMutate, false);
});

test("does hold the last question's reveal when the lock spends the turn", () => {
  let state: SerializableValue = choiceState(1);

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = hostAction(state, "lockChoices").state;

  assert.equal((state as TriviaRuntimeState).attemptsUsedThisTurn, 1);
  assert.equal(hostAction(state, "nextQuestion").didMutate, false);
  assert.notEqual((state as TriviaRuntimeState).reveal, null);
});

test("does keep the host's spoken verdict working when a question has no choices", () => {
  let state: SerializableValue = choiceState();

  state = hostAction(state, "recordAttempt", { isCorrect: false }).state;

  const judged = hostAction(state, "recordAttempt", { isCorrect: true }).state as TriviaRuntimeState;

  assert.equal(pendingOf(judged), 1);
  assert.equal(judged.reveal, null);
  assert.equal(judged.runtimeState.promptCursor, 2);
});

test("does let the host judge a choice question aloud when nobody's phone answers", () => {
  const judged = hostAction(choiceState(), "recordAttempt", { isCorrect: true }).state as TriviaRuntimeState;

  assert.equal(pendingOf(judged), 1);
  assert.equal(judged.reveal, null);
  assert.deepEqual(judged.choicesByPlayerId, {});
});

test("does keep the display view to a count when phones have chosen on an open question", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = choose(state, "player-3", { choiceIndex: 2 }).state;

  const displayView = triviaRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: choiceContent,
    answeringPlayers: seatedThree
  });
  const serialized = JSON.stringify(displayView);

  assert.ok(displayView?.minigame === "TRIVIA");
  assert.deepEqual(displayView.phoneAnswers, { answeredCount: 2, seatedCount: 3 });
  assert.deepEqual(displayView.currentPrompt?.choices, ["Jalapeño", "Carolina Reaper", "Poblano"]);
  assert.equal(displayView.reveal, null);
  // No choice index, no player, no answer.
  assert.equal(serialized.includes("choiceIndex"), false);
  assert.equal(serialized.includes("choicesByPlayerId"), false);
  assert.equal(serialized.includes("player-"), false);
  assert.equal(serialized.includes("correctIndex"), false);
  assert.equal(serialized.includes("\"answer\""), false);
});

test("does show the spread on the display view when the host locks the question", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = hostAction(state, "lockChoices").state;

  const displayView = triviaRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: choiceContent,
    answeringPlayers: seatedThree
  });

  assert.ok(displayView?.minigame === "TRIVIA");
  assert.deepEqual(displayView.reveal?.choiceCounts, [0, 1, 0]);
  assert.equal(displayView.reveal?.correctIndex, 1);
  assert.equal(displayView.phoneAnswers, null);
  // The spread is counts, never who.
  assert.equal(JSON.stringify(displayView).includes("player-"), false);
});

test("does show the host how many have chosen but never what or who when the question is open", () => {
  const state = choose(choiceState(), "player-2", { choiceIndex: 2 }).state;
  const hostView = triviaRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: choiceContent,
    answeringPlayers: seatedThree
  });

  assert.ok(hostView?.minigame === "TRIVIA");
  assert.deepEqual(hostView.phoneAnswers, { answeredCount: 1, seatedCount: 3 });
  assert.equal(JSON.stringify(hostView).includes("choicesByPlayerId"), false);
});

test("does show each phone only its own choice when two phones have chosen", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 2 }).state;
  state = choose(state, "player-2", { choiceIndex: 0 }).state;

  const viewOf = (playerId: string, showOwnAnswer = true) =>
    triviaRuntimePlugin.selectPlayerView?.({
      state,
      rules: null,
      content: choiceContent,
      answeringPlayers: seatedThree,
      playerId,
      showOwnAnswer
    });

  assert.equal(viewOf("player-1")?.minigame === "TRIVIA" ? viewOf("player-1")?.status : null, "open");
  assert.deepEqual(
    [viewOf("player-1"), viewOf("player-2"), viewOf("player-3")].map((view) =>
      view?.minigame === "TRIVIA" ? view.choiceIndex : undefined
    ),
    [2, 0, null]
  );
  // A face with a new holder sees a blank card.
  assert.equal(viewOf("player-1", false)?.minigame === "TRIVIA" ? viewOf("player-1", false)?.status : null, "open");
  assert.equal((viewOf("player-1", false) as { choiceIndex: number | null }).choiceIndex, null);
  // The phone never learns the answer before the reveal.
  assert.equal(JSON.stringify(viewOf("player-1")).includes("isCorrect\":null"), true);
  assert.equal(JSON.stringify(viewOf("player-1")).includes("\"answer\""), false);
});

test("does tell a phone whether it was right when the host reveals the question", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = choose(state, "player-2", { choiceIndex: 0 }).state;
  state = hostAction(state, "lockChoices").state;

  const viewOf = (playerId: string) =>
    triviaRuntimePlugin.selectPlayerView?.({
      state,
      rules: null,
      content: choiceContent,
      answeringPlayers: seatedThree,
      playerId,
      showOwnAnswer: true
    }) as { status: string; isCorrect: boolean | null };

  assert.equal(viewOf("player-1").status, "locked");
  assert.equal(viewOf("player-1").isCorrect, true);
  assert.equal(viewOf("player-2").isCorrect, false);
  assert.equal(viewOf("player-3").isCorrect, null);
});

test("does give a phone a card with no choices when the question has none", () => {
  const state = hostAction(choiceState(), "recordAttempt", { isCorrect: true }).state;
  const view = triviaRuntimePlugin.selectPlayerView?.({
    state,
    rules: null,
    content: choiceContent,
    answeringPlayers: seatedThree,
    playerId: "player-1",
    showOwnAnswer: true
  });

  assert.ok(view?.minigame === "TRIVIA");
  assert.equal(view.choices, null);
  assert.equal(view.status, "locked");
});

test("does drop a phone's open choice when its claim ends and keep a locked one", () => {
  const releasePlayerAnswer = triviaRuntimePlugin.releasePlayerAnswer;

  assert.ok(releasePlayerAnswer !== undefined);

  const chosen = choose(choiceState(), "player-1", { choiceIndex: 1 }).state;
  const released = releasePlayerAnswer({ state: chosen, playerId: "player-1" });

  assert.equal(released.didMutate, true);
  assert.deepEqual((released.state as TriviaRuntimeState).choicesByPlayerId, {});

  const locked = hostAction(chosen, "lockChoices").state;

  assert.equal(releasePlayerAnswer({ state: locked, playerId: "player-1" }).didMutate, false);
});

test("does leave the state untouched when a phone chooses and the host locks", () => {
  const state = choiceState();
  const before = structuredClone(state);
  const chosen = choose(state, "player-1", { choiceIndex: 1 }).state;
  const chosenBefore = structuredClone(chosen);

  hostAction(chosen, "lockChoices");

  assert.deepEqual(state, before);
  assert.deepEqual(chosen, chosenBefore);
});

test("does leave an asleep phone that never chose out of the share when the host locks", () => {
  const withDan = [seatedThree[0], seatedThree[1], { ...seatedThree[2], isConnected: false }];
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }, withDan).state;
  state = choose(state, "player-2", { choiceIndex: 0 }, withDan).state;

  const locked = hostAction(state, "lockChoices", {}, { answeringPlayers: withDan }).state as TriviaRuntimeState;

  // One of the two awake phones right: round(1/2) banks the point; Dan's sleeping phone is no "no".
  assert.equal(locked.reveal?.seatedCount, 2);
  assert.equal(pendingOf(locked), 1);
});

test("does keep an asleep phone in the share when it chose before it slept", () => {
  let state: SerializableValue = choiceState();

  state = choose(state, "player-1", { choiceIndex: 1 }).state;
  state = choose(state, "player-3", { choiceIndex: 0 }).state;

  const asleep = [seatedThree[0], { ...seatedThree[1], isConnected: false }, { ...seatedThree[2], isConnected: false }];
  const locked = hostAction(state, "lockChoices", {}, { answeringPlayers: asleep }).state as TriviaRuntimeState;

  assert.equal(locked.reveal?.seatedCount, 2);
  assert.deepEqual(locked.reveal?.choiceCounts, [1, 1, 0]);
});

test("does count only awake or answered phones in the tally when a phone is asleep", () => {
  const state = choose(choiceState(), "player-1", { choiceIndex: 1 }).state;
  const displayView = triviaRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: choiceContent,
    answeringPlayers: [seatedThree[0], seatedThree[1], { ...seatedThree[2], isConnected: false }]
  });

  assert.deepEqual(displayView?.minigame === "TRIVIA" ? displayView.phoneAnswers : undefined, {
    answeredCount: 1,
    seatedCount: 2
  });
});
