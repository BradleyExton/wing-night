import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { getNextPhase } from "./index.js";

test("maps each phase to the expected next phase", () => {
  assert.equal(getNextPhase(Phase.SETUP, 0, 3), Phase.INTRO);
  assert.equal(getNextPhase(Phase.INTRO, 0, 3), Phase.ROUND_INTRO);
  assert.equal(getNextPhase(Phase.ROUND_INTRO, 1, 3), Phase.MINIGAME_INTRO);
  assert.equal(getNextPhase(Phase.MINIGAME_INTRO, 1, 3), Phase.EATING);
  assert.equal(getNextPhase(Phase.EATING, 1, 3), Phase.MINIGAME_PLAY);
  assert.equal(getNextPhase(Phase.MINIGAME_PLAY, 1, 3), Phase.ROUND_RESULTS);
});

test("returns ROUND_INTRO after round results when additional rounds remain", () => {
  assert.equal(getNextPhase(Phase.ROUND_RESULTS, 1, 3), Phase.ROUND_INTRO);
  assert.equal(getNextPhase(Phase.ROUND_RESULTS, 2, 3), Phase.ROUND_INTRO);
  assert.equal(getNextPhase(Phase.ROUND_RESULTS, 3, 3), Phase.FINAL_RESULTS);
});

test("keeps FINAL_RESULTS idempotent", () => {
  assert.equal(getNextPhase(Phase.FINAL_RESULTS, 3, 3), Phase.FINAL_RESULTS);
});
