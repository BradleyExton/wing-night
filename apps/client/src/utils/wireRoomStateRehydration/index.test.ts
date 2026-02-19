import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_ROLES,
  CLIENT_TO_SERVER_EVENTS,
  Phase,
  SERVER_TO_CLIENT_EVENTS,
  type DisplayRoomStateSnapshot,
  type HostRoomStateSnapshot,
  type RoleScopedStateSnapshotEnvelope
} from "@wingnight/shared";

import { wireRoomStateRehydration } from "./index";

type RoomStateSocketEvents = {
  [SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]: (
    payload: RoleScopedStateSnapshotEnvelope
  ) => void;
  connect: () => void;
};

type RoomStateSocket = Parameters<typeof wireRoomStateRehydration>[0];

class MockRoomStateSocket {
  public requestedStateEvents = 0;
  public connected = false;
  public recovered = false;

  private readonly handlers: Partial<RoomStateSocketEvents> = {};

  public on<EventName extends keyof RoomStateSocketEvents>(
    event: EventName,
    listener: RoomStateSocketEvents[EventName]
  ): void {
    this.handlers[event] = listener;
  }

  public off<EventName extends keyof RoomStateSocketEvents>(
    event: EventName,
    listener: RoomStateSocketEvents[EventName]
  ): void {
    if (this.handlers[event] === listener) {
      delete this.handlers[event];
    }
  }

  public emit(event: typeof CLIENT_TO_SERVER_EVENTS.REQUEST_STATE): void {
    if (event === CLIENT_TO_SERVER_EVENTS.REQUEST_STATE) {
      this.requestedStateEvents += 1;
    }
  }

  public triggerSnapshot(payload: RoleScopedStateSnapshotEnvelope): void {
    this.handlers[SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]?.(payload);
  }

  public triggerConnect(): void {
    this.handlers.connect?.();
  }

  public hasSnapshotHandler(): boolean {
    return this.handlers[SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT] !== undefined;
  }

  public hasConnectHandler(): boolean {
    return this.handlers.connect !== undefined;
  }
}

const hostSnapshotFixture: HostRoomStateSnapshot = {
  phase: Phase.SETUP,
  currentRound: 0,
  totalRounds: 3,
  players: [{ id: "p1", name: "Player One" }],
  teams: [{ id: "t1", name: "Spice Team", playerIds: ["p1"], totalScore: 0 }],
  gameConfig: null,
  triviaPrompts: [],
  currentRoundConfig: null,
  turnOrderTeamIds: [],
  roundTurnCursor: -1,
  completedRoundTurnTeamIds: [],
  activeRoundTeamId: null,
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
  canRedoScoringMutation: false,
  canAdvancePhase: true
};

const displaySnapshotFixture: DisplayRoomStateSnapshot = {
  phase: hostSnapshotFixture.phase,
  currentRound: hostSnapshotFixture.currentRound,
  totalRounds: hostSnapshotFixture.totalRounds,
  players: hostSnapshotFixture.players,
  teams: hostSnapshotFixture.teams,
  gameConfig: hostSnapshotFixture.gameConfig,
  currentRoundConfig: hostSnapshotFixture.currentRoundConfig,
  turnOrderTeamIds: hostSnapshotFixture.turnOrderTeamIds,
  roundTurnCursor: hostSnapshotFixture.roundTurnCursor,
  completedRoundTurnTeamIds: hostSnapshotFixture.completedRoundTurnTeamIds,
  activeRoundTeamId: hostSnapshotFixture.activeRoundTeamId,
  activeTurnTeamId: hostSnapshotFixture.activeTurnTeamId,
  triviaPromptCursor: hostSnapshotFixture.triviaPromptCursor,
  timer: hostSnapshotFixture.timer,
  minigameDisplayView: hostSnapshotFixture.minigameDisplayView,
  wingParticipationByPlayerId: hostSnapshotFixture.wingParticipationByPlayerId,
  pendingWingPointsByTeamId: hostSnapshotFixture.pendingWingPointsByTeamId,
  pendingMinigamePointsByTeamId:
    hostSnapshotFixture.pendingMinigamePointsByTeamId,
  fatalError: hostSnapshotFixture.fatalError,
  canRedoScoringMutation: hostSnapshotFixture.canRedoScoringMutation,
  canAdvancePhase: hostSnapshotFixture.canAdvancePhase
};

test("requests latest state immediately when socket is connected and recovered is false", () => {
  const mockSocket = new MockRoomStateSocket();
  mockSocket.connected = true;
  mockSocket.recovered = false;

  wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    CLIENT_ROLES.HOST,
    () => {
      // No-op callback for this test.
    }
  );

  assert.equal(mockSocket.requestedStateEvents, 1);
});

test("requests state immediately when socket is connected with recovered transport", () => {
  const mockSocket = new MockRoomStateSocket();
  mockSocket.connected = true;
  mockSocket.recovered = true;

  wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    CLIENT_ROLES.HOST,
    () => {
      // No-op callback for this test.
    }
  );

  assert.equal(mockSocket.requestedStateEvents, 1);
});

test("requests state on connect event when transport recovery is unavailable", () => {
  const mockSocket = new MockRoomStateSocket();
  mockSocket.recovered = false;

  wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    CLIENT_ROLES.DISPLAY,
    () => {
      // No-op callback for this test.
    }
  );

  mockSocket.triggerConnect();

  assert.equal(mockSocket.requestedStateEvents, 1);
});

test("forwards only matching role snapshots to callback", () => {
  const mockSocket = new MockRoomStateSocket();
  const receivedSnapshots: DisplayRoomStateSnapshot[] = [];

  wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    CLIENT_ROLES.DISPLAY,
    (roomState) => {
      receivedSnapshots.push(roomState);
    }
  );

  mockSocket.triggerSnapshot({
    clientRole: CLIENT_ROLES.HOST,
    roomState: hostSnapshotFixture
  });
  mockSocket.triggerSnapshot({
    clientRole: CLIENT_ROLES.DISPLAY,
    roomState: displaySnapshotFixture
  });

  assert.deepEqual(receivedSnapshots, [displaySnapshotFixture]);
});

test("cleanup unregisters snapshot and connect listeners", () => {
  const mockSocket = new MockRoomStateSocket();

  const cleanup = wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    CLIENT_ROLES.HOST,
    () => {
      // No-op callback for this test.
    }
  );

  assert.equal(mockSocket.hasSnapshotHandler(), true);
  assert.equal(mockSocket.hasConnectHandler(), true);

  cleanup();

  assert.equal(mockSocket.hasSnapshotHandler(), false);
  assert.equal(mockSocket.hasConnectHandler(), false);
});
