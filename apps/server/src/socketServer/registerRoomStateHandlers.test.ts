import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RoomState } from "@wingnight/shared";

import { registerRoomStateHandlers } from "./registerRoomStateHandlers/index.js";

test("emits state snapshot immediately on registration", () => {
  const emittedSnapshots: RoomState[] = [];
  let hasRequestStateHandler = false;
  let requestStateHandler = (): void => {
    assert.fail("Expected client:requestState handler to be registered.");
  };

  const firstState: RoomState = {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  };

  const socket = {
    emit: (_event: "server:stateSnapshot", roomState: RoomState): void => {
      emittedSnapshots.push(roomState);
    },
    on: (_event: "client:requestState", listener: () => void): void => {
      hasRequestStateHandler = true;
      requestStateHandler = listener;
    }
  };

  registerRoomStateHandlers(socket, () => firstState);

  assert.equal(emittedSnapshots.length, 1);
  assert.deepEqual(emittedSnapshots[0], firstState);
  assert.equal(hasRequestStateHandler, true);
  requestStateHandler();
});

test("re-emits latest snapshot when client requests state", () => {
  const emittedSnapshots: RoomState[] = [];
  let hasRequestStateHandler = false;
  let requestStateHandler = (): void => {
    assert.fail("Expected client:requestState handler to be registered.");
  };

  const firstState: RoomState = {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  };
  const updatedState: RoomState = {
    phase: Phase.INTRO,
    currentRound: 1,
    players: [{ id: "p1", name: "Player One" }],
    teams: [{ id: "t1", name: "Spice Lords", playerIds: ["p1"], totalScore: 0 }]
  };

  let readCount = 0;
  const getSnapshot = (): RoomState => {
    readCount += 1;
    return readCount === 1 ? firstState : updatedState;
  };

  const socket = {
    emit: (_event: "server:stateSnapshot", roomState: RoomState): void => {
      emittedSnapshots.push(roomState);
    },
    on: (_event: "client:requestState", listener: () => void): void => {
      hasRequestStateHandler = true;
      requestStateHandler = listener;
    }
  };

  registerRoomStateHandlers(socket, getSnapshot);

  assert.equal(hasRequestStateHandler, true);
  requestStateHandler();

  assert.equal(emittedSnapshots.length, 2);
  assert.deepEqual(emittedSnapshots[0], firstState);
  assert.deepEqual(emittedSnapshots[1], updatedState);
});
