import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RoomState } from "@wingnight/shared";

import { wireRoomStateRehydration } from "./index";

type RoomStateSocketEvents = {
  connect: () => void;
  "server:stateSnapshot": (roomState: RoomState) => void;
};

class MockRoomStateSocket {
  public requestedStateEvents = 0;

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

  public triggerConnect(): void {
    this.handlers.connect?.();
  }

  public triggerSnapshot(roomState: RoomState): void {
    this.handlers["server:stateSnapshot"]?.(roomState);
  }

  public hasConnectHandler(): boolean {
    return this.handlers.connect !== undefined;
  }

  public hasSnapshotHandler(): boolean {
    return this.handlers["server:stateSnapshot"] !== undefined;
  }
}

test("requests latest state on socket connect", () => {
  const mockSocket = new MockRoomStateSocket();

  wireRoomStateRehydration(mockSocket as unknown as Parameters<typeof wireRoomStateRehydration>[0], () => {
    // No-op callback for this test.
  });

  mockSocket.triggerConnect();

  assert.equal(mockSocket.requestedStateEvents, 1);
});

test("forwards server snapshots to callback", () => {
  const mockSocket = new MockRoomStateSocket();
  const receivedSnapshots: RoomState[] = [];

  wireRoomStateRehydration(
    mockSocket as unknown as Parameters<typeof wireRoomStateRehydration>[0],
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

test("cleanup unregisters connect and snapshot listeners", () => {
  const mockSocket = new MockRoomStateSocket();

  const cleanup = wireRoomStateRehydration(
    mockSocket as unknown as Parameters<typeof wireRoomStateRehydration>[0],
    () => {
      // No-op callback for this test.
    }
  );

  assert.equal(mockSocket.hasConnectHandler(), true);
  assert.equal(mockSocket.hasSnapshotHandler(), true);

  cleanup();

  assert.equal(mockSocket.hasConnectHandler(), false);
  assert.equal(mockSocket.hasSnapshotHandler(), false);
});
