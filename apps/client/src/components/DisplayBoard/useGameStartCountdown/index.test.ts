import assert from "node:assert/strict";
import test from "node:test";
import { Phase } from "@wingnight/shared";

import {
  shouldCancelGameStartCountdown,
  shouldStartGameStartCountdown
} from "./index";

test("starts countdown only for INTRO to MINIGAME_INTRO transition in round one", () => {
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.MINIGAME_INTRO, 1),
    true
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.SETUP, Phase.MINIGAME_INTRO, 1),
    false
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.MINIGAME_INTRO, 2),
    false
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.EATING, 1),
    false
  );
});

// Every later team briefing is reached from TURN_RESULTS or ROUND_RESULTS, so
// the count-in never fires again after the night's first one.
test("does not count in again on a later team briefing", () => {
  assert.equal(
    shouldStartGameStartCountdown(Phase.TURN_RESULTS, Phase.MINIGAME_INTRO, 1),
    false
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.ROUND_RESULTS, Phase.MINIGAME_INTRO, 2),
    false
  );
});

test("does not start countdown on direct initial MINIGAME_INTRO load", () => {
  assert.equal(
    shouldStartGameStartCountdown(Phase.MINIGAME_INTRO, Phase.MINIGAME_INTRO, 1),
    false
  );
});

test("cancels countdown when phase leaves MINIGAME_INTRO", () => {
  assert.equal(shouldCancelGameStartCountdown(Phase.MINIGAME_INTRO), false);
  assert.equal(shouldCancelGameStartCountdown(Phase.EATING), true);
  assert.equal(shouldCancelGameStartCountdown(Phase.INTRO), true);
  assert.equal(shouldCancelGameStartCountdown(Phase.SETUP), true);
});
