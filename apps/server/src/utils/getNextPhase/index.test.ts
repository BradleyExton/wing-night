import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { getNextPhase } from "./index.js";

test("maps each phase to the expected next phase", () => {
  assert.equal(getNextPhase(Phase.SETUP), Phase.INTRO);
  assert.equal(getNextPhase(Phase.INTRO), Phase.ROUND_INTRO);
  assert.equal(getNextPhase(Phase.ROUND_INTRO), Phase.EATING);
  assert.equal(getNextPhase(Phase.EATING), Phase.MINIGAME_INTRO);
  assert.equal(getNextPhase(Phase.MINIGAME_INTRO), Phase.MINIGAME_PLAY);
  assert.equal(getNextPhase(Phase.MINIGAME_PLAY), Phase.ROUND_RESULTS);
  assert.equal(getNextPhase(Phase.ROUND_RESULTS), Phase.FINAL_RESULTS);
});

test("keeps FINAL_RESULTS idempotent", () => {
  assert.equal(getNextPhase(Phase.FINAL_RESULTS), Phase.FINAL_RESULTS);
});
