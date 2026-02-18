import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState, type TriviaPrompt } from "@wingnight/shared";

import {
  captureTriviaRuntimeStateSnapshot,
  initializeTriviaRuntimeState,
  reduceTriviaAttempt,
  restoreTriviaRuntimeStateSnapshot,
  resetTriviaRuntimeState,
  syncTriviaRuntimeWithPendingPoints,
  syncTriviaRuntimeWithPrompts
} from "./index.js";

const triviaPromptFixture: TriviaPrompt[] = [
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
];

const replacementPromptFixture: TriviaPrompt = {
  id: "prompt-replacement",
  question: "Replacement question?",
  answer: "Replacement answer"
};

const withRuntimeReset = (callback: () => void): void => {
  resetTriviaRuntimeState();

  try {
    callback();
  } finally {
    resetTriviaRuntimeState();
  }
};

const buildRoomState = (prompts: TriviaPrompt[] = triviaPromptFixture): RoomState => {
  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 2,
    players: [],
    teams: [
      {
        id: "team-1",
        name: "Team 1",
        playerIds: [],
        totalScore: 0
      },
      {
        id: "team-2",
        name: "Team 2",
        playerIds: [],
        totalScore: 0
      }
    ],
    gameConfig: null,
    triviaPrompts: structuredClone(prompts),
    currentRoundConfig: {
      round: 1,
      label: "Round 1",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    turnOrderTeamIds: ["team-1", "team-2"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: "team-1",
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false
  };
};

test("initializeTriviaRuntimeState sets turn order and projected trivia fields", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();

    initializeTriviaRuntimeState(roomState, 15);

    assert.deepEqual(roomState.turnOrderTeamIds, ["team-1", "team-2"]);
    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 0);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-1");
    assert.deepEqual(roomState.pendingMinigamePointsByTeamId, {});
  });
});

test("reduceTriviaAttempt keeps active round team and wraps prompt cursor", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 15);

    reduceTriviaAttempt(roomState, true, 15);
    assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 1);
    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 1);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-2");

    reduceTriviaAttempt(roomState, false, 15);
    assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 1);
    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 0);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-1");
  });
});

test("reduceTriviaAttempt enforces points cap", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 2);
    syncTriviaRuntimeWithPendingPoints(roomState, { "team-1": 2, "team-2": 0 });

    reduceTriviaAttempt(roomState, true, 2);

    assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 2);
  });
});

test("syncTriviaRuntimeWithPrompts preserves active round team and normalizes cursor on prompt replacement", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 15);
    reduceTriviaAttempt(roomState, true, 15);

    roomState.triviaPrompts = [replacementPromptFixture];
    syncTriviaRuntimeWithPrompts(roomState);

    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 0);
    assert.equal(roomState.currentTriviaPrompt?.id, replacementPromptFixture.id);
  });
});

test("syncTriviaRuntimeWithPendingPoints updates pending points without changing active team", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 15);
    reduceTriviaAttempt(roomState, true, 15);

    syncTriviaRuntimeWithPendingPoints(roomState, {
      "team-1": 8,
      "team-2": 3
    });

    assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 8);
    assert.equal(roomState.pendingMinigamePointsByTeamId["team-2"], 3);
    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 1);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-2");
  });
});

test("capture/restore runtime snapshot rewinds trivia prompt and pending points", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 15);
    reduceTriviaAttempt(roomState, true, 15);
    const runtimeSnapshot = captureTriviaRuntimeStateSnapshot();

    reduceTriviaAttempt(roomState, false, 15);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-1");

    restoreTriviaRuntimeStateSnapshot(roomState, runtimeSnapshot);
    assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 1);
    assert.equal(roomState.activeTurnTeamId, "team-1");
    assert.equal(roomState.triviaPromptCursor, 1);
    assert.equal(roomState.currentTriviaPrompt?.id, "prompt-2");
  });
});

test("restoring null runtime snapshot clears trivia projection fields", () => {
  withRuntimeReset(() => {
    const roomState = buildRoomState();
    initializeTriviaRuntimeState(roomState, 15);

    restoreTriviaRuntimeStateSnapshot(roomState, null);

    assert.equal(roomState.activeTurnTeamId, null);
    assert.equal(roomState.currentTriviaPrompt, null);
    assert.equal(roomState.triviaPromptCursor, 0);
    assert.equal(roomState.minigameHostView, null);
    assert.equal(roomState.minigameDisplayView, null);
  });
});
