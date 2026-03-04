import assert from "node:assert/strict";
import test from "node:test";
import { Phase } from "@wingnight/shared";

import {
  shouldCancelGameStartCountdown,
  shouldStartGameStartCountdown
} from "./index";

test("starts countdown only for INTRO to ROUND_INTRO transition in round one", () => {
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.ROUND_INTRO, 1),
    true
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.SETUP, Phase.ROUND_INTRO, 1),
    false
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.ROUND_INTRO, 2),
    false
  );
  assert.equal(
    shouldStartGameStartCountdown(Phase.INTRO, Phase.EATING, 1),
    false
  );
});

test("does not start countdown on direct initial ROUND_INTRO load", () => {
  assert.equal(
    shouldStartGameStartCountdown(Phase.ROUND_INTRO, Phase.ROUND_INTRO, 1),
    false
  );
});

test("cancels countdown when phase leaves ROUND_INTRO", () => {
  assert.equal(shouldCancelGameStartCountdown(Phase.ROUND_INTRO), false);
  assert.equal(shouldCancelGameStartCountdown(Phase.EATING), true);
  assert.equal(shouldCancelGameStartCountdown(Phase.MINIGAME_INTRO), true);
  assert.equal(shouldCancelGameStartCountdown(Phase.SETUP), true);
});
