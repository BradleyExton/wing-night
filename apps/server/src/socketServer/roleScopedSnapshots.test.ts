import assert from "node:assert/strict";
import test from "node:test";

import {
  DISPLAY_SAFE_ROOM_STATE_KEYS,
  PLAYER_SAFE_ROOM_STATE_KEYS,
  Phase,
  toDisplayRoomStateSnapshot,
  toPlayerRoomStateSnapshot,
  toRoleScopedSnapshotEnvelope,
  type RoomState
} from "@wingnight/shared";

const createRoomStateFixture = (): RoomState => {
  return {
    phase: Phase.SETUP,
    sessionMode: "NIGHT",
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: [],
    lobbyPlaylist: [],
    eatingPlaylist: [],
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
    gameStartCountdownEndsAt: null,
    musicPlayback: null,
    musicVolume: 1,
    sfxVolume: 1,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false,
    claimedPlayerIds: [],
    connectedPlayerIds: []
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

test("toDisplayRoomStateSnapshot exposes every display-safe room-state key", () => {
  const roomState = createRoomStateFixture();
  const displaySnapshot = toDisplayRoomStateSnapshot(roomState);

  for (const safeKey of DISPLAY_SAFE_ROOM_STATE_KEYS) {
    assert.equal(safeKey in displaySnapshot, true);
  }

  assert.equal("minigameHostView" in displaySnapshot, false);
});

test("does build a player snapshot from exactly its own allow-list", () => {
  const roomState = createRoomStateFixture();
  const playerSnapshot = toPlayerRoomStateSnapshot(roomState);

  assert.deepEqual(Object.keys(playerSnapshot).sort(), [...PLAYER_SAFE_ROOM_STATE_KEYS].sort());
});

test("does leave answers, rules, playlists and the TV's game view off a phone", () => {
  const roomState: RoomState = {
    ...createRoomStateFixture(),
    lobbyPlaylist: ["lobby.mp3"],
    eatingPlaylist: ["eating.mp3"],
    connectedPlayerIds: ["player-1"]
  };
  const envelope = toRoleScopedSnapshotEnvelope("PLAYER", roomState);

  assert.equal(envelope.clientRole, "PLAYER");

  for (const forbiddenKey of [
    "minigameHostView",
    "minigameDisplayView",
    "gameConfig",
    "currentRoundConfig",
    "lobbyPlaylist",
    "eatingPlaylist",
    "musicPlayback",
    "connectedPlayerIds"
  ]) {
    assert.equal(forbiddenKey in envelope.roomState, false, forbiddenKey);
  }
});

test("does give the display claimed ids but not who is asleep", () => {
  const displaySnapshot = toDisplayRoomStateSnapshot({
    ...createRoomStateFixture(),
    claimedPlayerIds: ["player-1", "player-2"],
    connectedPlayerIds: ["player-1"]
  });

  assert.deepEqual(displaySnapshot.claimedPlayerIds, ["player-1", "player-2"]);
  assert.equal("connectedPlayerIds" in displaySnapshot, false);
});
