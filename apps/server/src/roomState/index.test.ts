import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { createInitialRoomState, getRoomStateSnapshot } from "./index.js";

test("createInitialRoomState returns setup defaults", () => {
  assert.deepEqual(createInitialRoomState(), {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  });
});

test("getRoomStateSnapshot returns a safe clone", () => {
  const firstSnapshot = getRoomStateSnapshot();
  firstSnapshot.players.push({ id: "p1", name: "Player One" });

  const secondSnapshot = getRoomStateSnapshot();

  assert.equal(secondSnapshot.players.length, 0);
});
