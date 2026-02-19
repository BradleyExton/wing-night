import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_ROLES,
  DISPLAY_UNSAFE_ROOM_STATE_KEYS,
  Phase,
  type RoomState
} from "@wingnight/shared";

import { createRoleScopedSnapshot } from "./index.js";

const buildRoomState = (): RoomState => {
  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 2,
    players: [],
    teams: [],
    gameConfig: null,
    triviaPrompts: [
      {
        id: "prompt-1",
        question: "Question 1?",
        answer: "Answer 1"
      }
    ],
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: "team-1",
    currentTriviaPrompt: {
      id: "prompt-1",
      question: "Question 1?",
      answer: "Answer 1"
    },
    triviaPromptCursor: 0,
    minigameHostView: {
      minigame: "TRIVIA",
      minigameApiVersion: 1,
      capabilityFlags: ["recordAttempt"],
      compatibilityStatus: "COMPATIBLE",
      compatibilityMessage: null,
      activeTurnTeamId: "team-1",
      attemptsRemaining: 1,
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: {
        id: "prompt-1",
        question: "Question 1?",
        answer: "Answer 1"
      }
    },
    minigameDisplayView: {
      minigame: "TRIVIA",
      minigameApiVersion: 1,
      capabilityFlags: ["recordAttempt"],
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
};

test("returns host snapshot envelope with full room state for HOST clients", () => {
  const roomState = buildRoomState();

  const payload = createRoleScopedSnapshot(roomState, CLIENT_ROLES.HOST);

  assert.equal(payload.clientRole, CLIENT_ROLES.HOST);
  assert.equal(payload.roomState, roomState);
  assert.equal(payload.roomState.currentTriviaPrompt?.answer, "Answer 1");
  assert.equal(payload.roomState.minigameHostView?.currentPrompt?.answer, "Answer 1");
});

test("returns display-safe snapshot envelope for DISPLAY clients", () => {
  const roomState = buildRoomState();

  const payload = createRoleScopedSnapshot(roomState, CLIENT_ROLES.DISPLAY);

  assert.equal(payload.clientRole, CLIENT_ROLES.DISPLAY);
  for (const unsafeKey of DISPLAY_UNSAFE_ROOM_STATE_KEYS) {
    assert.equal(unsafeKey in payload.roomState, false);
  }
  assert.equal(payload.roomState.minigameDisplayView?.currentPrompt?.question, "Question 1?");
});
