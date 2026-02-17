import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type RoomState } from "@wingnight/shared";

import {
  clearTriviaProjectionFromRoomState,
  projectTriviaHostViewToRoomState
} from "./index.js";

const buildRoomState = (): RoomState => {
  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 2,
    players: [],
    teams: [],
    gameConfig: null,
    triviaPrompts: [],
    currentRoundConfig: null,
    turnOrderTeamIds: ["team-1", "team-2"],
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
  };
};

test("projectTriviaHostViewToRoomState applies projected trivia fields", () => {
  const roomState = buildRoomState();

  projectTriviaHostViewToRoomState(roomState, {
    activeTurnTeamId: "team-2",
    promptCursor: 3,
    currentPrompt: {
      id: "prompt-1",
      question: "Question 1?",
      answer: "Answer 1"
    },
    pendingPointsByTeamId: {
      "team-1": 5
    }
  });

  assert.equal(roomState.activeTurnTeamId, "team-2");
  assert.equal(roomState.triviaPromptCursor, 3);
  assert.equal(roomState.currentTriviaPrompt?.answer, "Answer 1");
  assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 5);
});

test("clearTriviaProjectionFromRoomState clears active trivia projection fields", () => {
  const roomState = buildRoomState();

  roomState.activeTurnTeamId = "team-1";
  roomState.triviaPromptCursor = 2;
  roomState.currentTriviaPrompt = {
    id: "prompt-1",
    question: "Question 1?",
    answer: "Answer 1"
  };
  roomState.pendingMinigamePointsByTeamId = { "team-1": 5 };

  clearTriviaProjectionFromRoomState(roomState);

  assert.equal(roomState.activeTurnTeamId, null);
  assert.equal(roomState.triviaPromptCursor, 0);
  assert.equal(roomState.currentTriviaPrompt, null);
  assert.equal(roomState.pendingMinigamePointsByTeamId["team-1"], 5);
});
