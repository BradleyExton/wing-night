import assert from "node:assert/strict";
import test from "node:test";

import {
  DISPLAY_SAFE_ROOM_STATE_KEYS,
  Phase,
  toDisplayRoomStateSnapshot,
  toHostRoomStateSnapshot,
  toRoleScopedSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

const createRoomStateFixture = (): RoomState => {
  return {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: [],
    lobbyPlaylist: [],
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
    minigameDisplayView: {
      minigame: "TRIVIA",
      activeTurnTeamId: null,
      pendingPointsByTeamId: {},
      promptCursor: 0,
      currentPrompt: null
    },
    timer: null,
    musicPlayback: null,
    musicVolume: 1,
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

test("toRoleScopedSnapshotEnvelope drops the display view from the host payload", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("HOST", roomState);

  // The host tablet renders minigameHostView; shipping the display's copy of the
  // same turn doubled the bytes a DRAWING board cost the tablet. `in` rather than a
  // null check: the key has to be absent from the object, not merely emptied.
  assert.equal("minigameDisplayView" in snapshot.roomState, false);
});

test("toHostRoomStateSnapshot keeps every room-state key but the display view", () => {
  const roomState = createRoomStateFixture();
  const hostSnapshot = toHostRoomStateSnapshot(roomState);

  for (const stateKey of Object.keys(roomState)) {
    assert.equal(stateKey in hostSnapshot, stateKey !== "minigameDisplayView");
  }
});

test("toRoleScopedSnapshotEnvelope removes host payload for display role", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("DISPLAY", roomState);

  assert.equal(snapshot.clientRole, "DISPLAY");
  assert.equal("minigameHostView" in snapshot.roomState, false);
});

test("toDisplayRoomStateSnapshot exposes every display-safe room-state key", () => {
  const roomState = createRoomStateFixture();
  const displaySnapshot = toDisplayRoomStateSnapshot(roomState);

  for (const safeKey of DISPLAY_SAFE_ROOM_STATE_KEYS) {
    assert.equal(safeKey in displaySnapshot, true);
  }

  assert.equal("minigameHostView" in displaySnapshot, false);
});
