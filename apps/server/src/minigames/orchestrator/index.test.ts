import assert from "node:assert/strict";
import test from "node:test";

import {
  MINIGAME_ACTION_TYPES,
  Phase,
  type GameConfigFile,
  type MinigameActionEnvelopePayload,
  type RoomState,
  type TriviaPrompt
} from "@wingnight/shared";

import { getMinigameRegistryDescriptor } from "../registry/index.js";
import {
  captureMinigameRuntimeSnapshot,
  clearMinigameRuntime,
  dispatchMinigameRuntimeAction,
  initializeMinigameRuntime,
  restoreMinigameRuntimeSnapshot
} from "./index.js";

const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    }
  ],
  minigameScoring: {
    defaultMax: 15,
    finalRoundMax: 20
  },
  timers: {
    eatingSeconds: 120,
    triviaSeconds: 30,
    geoSeconds: 45,
    drawingSeconds: 60
  }
};

const triviaPromptsFixture: TriviaPrompt[] = [
  {
    id: "prompt-1",
    question: "Question 1?",
    answer: "Answer 1"
  }
];

const buildRoomState = (
  overrides: Partial<RoomState> = {}
): RoomState => {
  const snapshot: RoomState = {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 1,
    players: [{ id: "player-1", name: "Player One" }],
    teams: [{ id: "team-1", name: "Team One", playerIds: ["player-1"], totalScore: 0 }],
    gameConfig: gameConfigFixture,
    triviaPrompts: triviaPromptsFixture,
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: ["team-1"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: "team-1",
    activeTurnTeamId: "team-1",
    currentTriviaPrompt: triviaPromptsFixture[0] ?? null,
    triviaPromptCursor: 0,
    minigameHostView: {
      minigame: "TRIVIA",
      minigameApiVersion: 1,
      capabilityFlags: [MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT],
      compatibilityStatus: "COMPATIBLE",
      compatibilityMessage: null,
      activeTurnTeamId: "team-1",
      attemptsRemaining: 1,
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: triviaPromptsFixture[0] ?? null
    },
    minigameDisplayView: {
      minigame: "TRIVIA",
      minigameApiVersion: 1,
      capabilityFlags: [MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT],
      activeTurnTeamId: "team-1",
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: {
        id: "prompt-1",
        question: "Question 1?"
      }
    },
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

const triviaActionEnvelopePayload: MinigameActionEnvelopePayload = {
  hostSecret: "host-secret",
  minigameId: "TRIVIA",
  minigameApiVersion: 1,
  actionType: MINIGAME_ACTION_TYPES.TRIVIA_RECORD_ATTEMPT,
  actionPayload: {
    isCorrect: true
  }
};

test("clearMinigameRuntime returns safe shell state when runtime adapter is unavailable", () => {
  const roomState = buildRoomState({
    currentRoundConfig: {
      ...gameConfigFixture.rounds[0],
      minigame: "GEO"
    }
  });

  clearMinigameRuntime(roomState);

  assert.equal(roomState.activeTurnTeamId, null);
  assert.equal(roomState.currentTriviaPrompt, null);
  assert.equal(roomState.triviaPromptCursor, 0);
  assert.equal(roomState.minigameHostView, null);
  assert.equal(roomState.minigameDisplayView, null);
});

test("capture and restore round-trips trivia runtime snapshot through orchestrator", () => {
  const roomState = buildRoomState({
    minigameHostView: null,
    minigameDisplayView: null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null
  });

  initializeMinigameRuntime(roomState, {
    minigameId: "TRIVIA",
    pointsMax: 10,
    questionsPerTurn: 1
  });
  dispatchMinigameRuntimeAction(roomState, {
    actionEnvelope: triviaActionEnvelopePayload,
    pointsMax: 10,
    questionsPerTurn: 1
  });

  const runtimeSnapshot = captureMinigameRuntimeSnapshot(roomState);

  clearMinigameRuntime(roomState);

  restoreMinigameRuntimeSnapshot(roomState, runtimeSnapshot);

  const restoredHostView = roomState.minigameHostView;

  assert.notEqual(restoredHostView, null);

  if (restoredHostView === null) {
    assert.fail("Expected minigame host view to be restored.");
  }

  assert.equal(restoredHostView.minigame, "TRIVIA");
  assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 1);
});

test("dispatchMinigameRuntimeAction isolates adapter exceptions and logs non-fatal runtime errors", () => {
  const roomState = buildRoomState();
  const descriptor = getMinigameRegistryDescriptor("TRIVIA");

  if (descriptor.runtimeAdapter === null) {
    assert.fail("Expected trivia runtime adapter to be registered.");
  }

  const originalDispatch = descriptor.runtimeAdapter.dispatch;
  const originalConsoleError = console.error;
  const loggedMessages: unknown[] = [];

  descriptor.runtimeAdapter.dispatch = () => {
    throw new Error("runtime dispatch failure");
  };
  console.error = (...args: unknown[]): void => {
    loggedMessages.push(args[0]);
  };

  try {
    const didDispatch = dispatchMinigameRuntimeAction(roomState, {
      actionEnvelope: triviaActionEnvelopePayload,
      pointsMax: 10,
      questionsPerTurn: 1
    });

    assert.equal(didDispatch, false);
    assert.equal(roomState.activeTurnTeamId, null);
    assert.equal(roomState.currentTriviaPrompt, null);
    assert.equal(roomState.triviaPromptCursor, 0);
    assert.equal(roomState.minigameHostView, null);
    assert.equal(roomState.minigameDisplayView, null);
    assert.ok(loggedMessages.includes("server:minigameRuntimeError"));
  } finally {
    descriptor.runtimeAdapter.dispatch = originalDispatch;
    console.error = originalConsoleError;
  }
});
