import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RoomState } from "@wingnight/shared";

import { wireRoomStateRehydration } from "./index";

type RoomStateSocketEvents = {
  "server:stateSnapshot": (roomState: RoomState) => void;
};
type RoomStateSocket = Parameters<typeof wireRoomStateRehydration>[0];

class MockRoomStateSocket {
  public requestedStateEvents = 0;
  public connected = false;

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

  public emit(event: "client:requestState"): void {
    if (event === "client:requestState") {
      this.requestedStateEvents += 1;
    }
  }

  public triggerSnapshot(roomState: RoomState): void {
    this.handlers["server:stateSnapshot"]?.(roomState);
  }

  public hasSnapshotHandler(): boolean {
    return this.handlers["server:stateSnapshot"] !== undefined;
  }
}

test("requests latest state immediately when socket is already connected", () => {
  const mockSocket = new MockRoomStateSocket();
  mockSocket.connected = true;

  wireRoomStateRehydration(mockSocket as unknown as RoomStateSocket, () => {
    // No-op callback for this test.
  });

  assert.equal(mockSocket.requestedStateEvents, 1);
});

test("does not request state while disconnected during initial wiring", () => {
  const mockSocket = new MockRoomStateSocket();

  wireRoomStateRehydration(mockSocket as unknown as RoomStateSocket, () => {
    // No-op callback for this test.
  });

  assert.equal(mockSocket.requestedStateEvents, 0);
});

test("forwards server snapshots to callback", () => {
  const mockSocket = new MockRoomStateSocket();
  const receivedSnapshots: RoomState[] = [];

  wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    (roomState) => {
      receivedSnapshots.push(roomState);
    }
  );

  const snapshot: RoomState = {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [{ id: "p1", name: "Player One" }],
    teams: [{ id: "t1", name: "Spice Team", playerIds: ["p1"], totalScore: 0 }]
  };

  mockSocket.triggerSnapshot(snapshot);

  assert.deepEqual(receivedSnapshots, [snapshot]);
});

test("cleanup unregisters snapshot listener", () => {
  const mockSocket = new MockRoomStateSocket();

  const cleanup = wireRoomStateRehydration(
    mockSocket as unknown as RoomStateSocket,
    () => {
      // No-op callback for this test.
    }
  );

  assert.equal(mockSocket.hasSnapshotHandler(), true);

  cleanup();

  assert.equal(mockSocket.hasSnapshotHandler(), false);
});
