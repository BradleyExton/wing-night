import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  createInitialRoomState,
  getRoomStateSnapshot,
  resetRoomState
} from "./index.js";

test("createInitialRoomState returns setup defaults", () => {
  assert.deepEqual(createInitialRoomState(), {
    phase: Phase.SETUP,
    currentRound: 0,
    players: [],
    teams: []
  });
});

test("getRoomStateSnapshot returns a safe clone", () => {
  resetRoomState();

  const firstSnapshot = getRoomStateSnapshot();
  firstSnapshot.players.push({ id: "p1", name: "Player One" });

  const secondSnapshot = getRoomStateSnapshot();

  assert.equal(secondSnapshot.players.length, 0);
});

test("advanceRoomStatePhase transitions setup to intro", () => {
  resetRoomState();

  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.INTRO);
  assert.equal(nextState.currentRound, 0);
});

test("advanceRoomStatePhase sets currentRound to 1 on INTRO -> ROUND_INTRO", () => {
  resetRoomState();

  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 1);
});

test("advanceRoomStatePhase preserves currentRound after round intro", () => {
  resetRoomState();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.EATING);
  assert.equal(nextState.currentRound, 1);
});

test("advanceRoomStatePhase is idempotent at FINAL_RESULTS", () => {
  resetRoomState();

  for (let step = 0; step < 10; step += 1) {
    advanceRoomStatePhase();
  }

  const finalSnapshot = getRoomStateSnapshot();

  assert.equal(finalSnapshot.phase, Phase.FINAL_RESULTS);
  assert.equal(finalSnapshot.currentRound, 1);
});

test("advanceRoomStatePhase logs transition metadata", () => {
  resetRoomState();

  const originalConsoleWarn = console.warn;
  const logCalls: unknown[][] = [];

  console.warn = ((...args: unknown[]): void => {
    logCalls.push(args);
  }) as typeof console.warn;

  try {
    advanceRoomStatePhase();
  } finally {
    console.warn = originalConsoleWarn;
  }

  const transitionLog = logCalls.find(
    (args) => args[0] === "server:phaseTransition"
  );

  assert.ok(transitionLog);
  assert.deepEqual(transitionLog[1], {
    previousPhase: Phase.SETUP,
    nextPhase: Phase.INTRO,
    currentRound: 0
  });
});
