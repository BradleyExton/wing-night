import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "../phase/index.js";
import {
  resolveBaseTurnOrderTeamIds,
  resolveRoomTurnOrderTeamIds,
  resolveRoundTurnOrderTeamIds,
  resolveTurnOrderRoundNumber
} from "./index.js";

const BASE_ORDER = ["team-1", "team-2", "team-3"];

test("does open each round one team further down the base order and wrap", () => {
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, 1), ["team-1", "team-2", "team-3"]);
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, 2), ["team-2", "team-3", "team-1"]);
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, 3), ["team-3", "team-1", "team-2"]);
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, 4), ["team-1", "team-2", "team-3"]);
});

test("does keep the base order when the round number is missing or below one", () => {
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, 0), BASE_ORDER);
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, -2), BASE_ORDER);
  assert.deepEqual(resolveRoundTurnOrderTeamIds(BASE_ORDER, Number.NaN), BASE_ORDER);
  assert.deepEqual(resolveRoundTurnOrderTeamIds([], 3), []);
});

test("does recover the base order from a round's order for every round", () => {
  for (let roundNumber = 1; roundNumber <= 7; roundNumber += 1) {
    const roundOrder = resolveRoundTurnOrderTeamIds(BASE_ORDER, roundNumber);

    assert.deepEqual(resolveBaseTurnOrderTeamIds(roundOrder, roundNumber), BASE_ORDER);
  }

  assert.deepEqual(resolveBaseTurnOrderTeamIds(["team-2", "team-1"], 2), ["team-1", "team-2"]);
  assert.deepEqual(resolveBaseTurnOrderTeamIds([], 2), []);
});

test("does resolve the round in progress, or the one about to start, as the order's round", () => {
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.SETUP, currentRound: 0 }), 1);
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.INTRO, currentRound: 0 }), 1);
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.EATING, currentRound: 2 }), 2);
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.TURN_RESULTS, currentRound: 3 }), 3);
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.ROUND_RESULTS, currentRound: 2 }), 3);
  assert.equal(resolveTurnOrderRoundNumber({ phase: Phase.FINAL_RESULTS, currentRound: 4 }), 4);
});

test("does rotate the room's base order for the round it is on", () => {
  assert.deepEqual(
    resolveRoomTurnOrderTeamIds({
      phase: Phase.INTRO,
      currentRound: 0,
      turnOrderTeamIds: BASE_ORDER
    }),
    ["team-1", "team-2", "team-3"]
  );
  assert.deepEqual(
    resolveRoomTurnOrderTeamIds({
      phase: Phase.ROUND_RESULTS,
      currentRound: 1,
      turnOrderTeamIds: BASE_ORDER
    }),
    ["team-2", "team-3", "team-1"]
  );
  assert.deepEqual(
    resolveRoomTurnOrderTeamIds({
      phase: Phase.MINIGAME_INTRO,
      currentRound: 3,
      turnOrderTeamIds: BASE_ORDER
    }),
    ["team-3", "team-1", "team-2"]
  );
});
