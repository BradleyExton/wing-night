import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTESTANT_CONTROLLERS,
  DISPLAY_SAFE_ROOM_STATE_KEYS,
  PLAYER_SAFE_ROOM_STATE_KEYS,
  Phase,
  toDisplayRoomStateSnapshot,
  toHostRoomStateSnapshot,
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
      currentPrompt: null,
      phoneAnswers: null,
      reveal: null
    },
    minigameDisplayView: {
      minigame: "TRIVIA",
      activeTurnTeamId: null,
      promptCursor: 0,
      attemptsRemaining: 1,
      pendingPointsByTeamId: {},
      currentPrompt: null,
      phoneAnswers: null,
      reveal: null
    },
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
    connectedPlayerIds: [],
    roundDeviceModes: {},
    contestantTurn: null,
    spectatorBets: null,
    betTallyByPlayerId: {}
  };
};

test("toRoleScopedSnapshotEnvelope keeps host payload intact", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("HOST", roomState);

  assert.equal(snapshot.clientRole, "HOST");
  assert.equal(snapshot.roomState.minigameHostView?.minigame, "TRIVIA");
});

test("toRoleScopedSnapshotEnvelope drops the display view from the host payload when no phone holds the leg", () => {
  const roomState = createRoomStateFixture();

  const snapshot = toRoleScopedSnapshotEnvelope("HOST", roomState);

  // The tablet renders minigameHostView; the TV's copy of the same turn doubled what a DRAWING
  // board cost the tablet.
  assert.equal(snapshot.roomState.minigameDisplayView, null);
  assert.notEqual(roomState.minigameDisplayView, null);
});

test("toRoleScopedSnapshotEnvelope keeps the display view for the host while a phone holds the leg", () => {
  const roomState: RoomState = {
    ...createRoomStateFixture(),
    contestantTurn: {
      minigame: "FAPPY",
      deviceMode: "phones",
      legIndex: 0,
      contestantPlayerId: "p1",
      nextContestantPlayerId: null,
      controller: CONTESTANT_CONTROLLERS.PHONE,
      tabletLegIndexes: [],
      droppedPlayerId: null
    }
  };

  const snapshot = toRoleScopedSnapshotEnvelope("HOST", roomState);

  // The tablet mirrors the TV's picture while the phone plays (ContestantPhoneMonitor).
  assert.equal(snapshot.roomState.minigameDisplayView, roomState.minigameDisplayView);
});

test("toHostRoomStateSnapshot keeps every room-state key", () => {
  const roomState = createRoomStateFixture();
  const hostSnapshot = toHostRoomStateSnapshot(roomState);

  assert.deepEqual(Object.keys(hostSnapshot).sort(), Object.keys(roomState).sort());
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
