import assert from "node:assert/strict";
import test from "node:test";

import { Phase, toRoleScopedSnapshotEnvelope, type RoomState } from "@wingnight/shared";

const createRoomStateFixture = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: [],
    gameConfig: null,
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    minigameHostView: {
      minigame: "TRIVIA",
      activeTurnTeamId: null,
      attemptsRemaining: 1,
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: null
    },
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false
  };
};

test("toRoleScopedSnapshotEnvelope keeps host payload intact", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("HOST", roomState);

  assert.equal(snapshot.clientRole, "HOST");
  assert.equal(snapshot.roomState.minigameHostView?.minigame, "TRIVIA");
});

test("toRoleScopedSnapshotEnvelope removes host payload for display role", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("DISPLAY", roomState);

  assert.equal(snapshot.clientRole, "DISPLAY");
  assert.equal("minigameHostView" in snapshot.roomState, false);
});
