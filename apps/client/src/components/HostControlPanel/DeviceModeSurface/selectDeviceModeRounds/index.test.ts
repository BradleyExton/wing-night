import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type GameConfigFile, type RoomState } from "@wingnight/shared";

import { selectDeviceModeRounds } from "./index";

const GAME_CONFIG = {
  rounds: [
    { round: 1, label: "Warm Up", sauce: "Frank's", pointsPerPlayer: 2, minigame: "SCHLONIC" },
    { round: 2, label: "Second Heat", sauce: "Buffalo", pointsPerPlayer: 3, minigame: "GEO" },
    { round: 3, label: "Spicy", sauce: "Mango", pointsPerPlayer: 3, minigame: "FAPPY" }
  ]
} as unknown as GameConfigFile;

const room = (phase: Phase, currentRound: number, roundDeviceModes: RoomState["roundDeviceModes"] = {}) => ({
  phase,
  currentRound,
  gameConfig: GAME_CONFIG,
  roundDeviceModes
});

test("does offer every arcade round of the night when the night has not started", () => {
  assert.deepEqual(selectDeviceModeRounds(room(Phase.SETUP, 0, { 3: "phones" })), [
    { round: 1, minigame: "SCHLONIC", deviceMode: "tablet" },
    { round: 3, minigame: "FAPPY", deviceMode: "phones" }
  ]);
  assert.equal(selectDeviceModeRounds(room(Phase.INTRO, 0)).length, 2);
});

test("does offer only the round in hand when a turn is under way", () => {
  assert.deepEqual(selectDeviceModeRounds(room(Phase.MINIGAME_INTRO, 3)), [
    { round: 3, minigame: "FAPPY", deviceMode: "tablet" }
  ]);
  assert.deepEqual(selectDeviceModeRounds(room(Phase.EATING, 2)), []);
});

test("does offer the rounds still to come when the night is between rounds", () => {
  assert.deepEqual(
    selectDeviceModeRounds(room(Phase.ROUND_RESULTS, 1)).map((entry) => entry.round),
    [3]
  );
});

test("does offer nothing when play is live or the night is over", () => {
  assert.deepEqual(selectDeviceModeRounds(room(Phase.MINIGAME_PLAY, 1)), []);
  assert.deepEqual(selectDeviceModeRounds(room(Phase.FINAL_RESULTS, 3)), []);
});
