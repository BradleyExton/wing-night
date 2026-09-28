import assert from "node:assert/strict";
import test from "node:test";
import { Phase } from "@wingnight/shared";

import { resolveCountInCue, resolvePhaseCue } from "./index";

test("does gong the wings, sting the results and fanfare the finale", () => {
  assert.equal(resolvePhaseCue(Phase.MINIGAME_INTRO, Phase.EATING), "gong");
  assert.equal(resolvePhaseCue(Phase.MINIGAME_PLAY, Phase.TURN_RESULTS), "results");
  assert.equal(resolvePhaseCue(Phase.TURN_RESULTS, Phase.ROUND_RESULTS), "results");
  assert.equal(resolvePhaseCue(Phase.ROUND_RESULTS, Phase.FINAL_RESULTS), "fanfare");
});

test("does swoosh every other move of the night", () => {
  assert.equal(resolvePhaseCue(Phase.SETUP, Phase.INTRO), "whoosh");
  assert.equal(resolvePhaseCue(Phase.INTRO, Phase.MINIGAME_INTRO), "whoosh");
  assert.equal(resolvePhaseCue(Phase.EATING, Phase.MINIGAME_PLAY), "whoosh");
  assert.equal(resolvePhaseCue(Phase.FINAL_RESULTS, Phase.SETUP), "whoosh");
});

test("does stay quiet on the first reading and while the phase holds", () => {
  assert.equal(resolvePhaseCue(null, Phase.EATING), null);
  assert.equal(resolvePhaseCue(Phase.EATING, Phase.EATING), null);
  assert.equal(resolvePhaseCue(Phase.EATING, null), null);
});

test("does tick three, two, one and fire the pistol as the count-in lands", () => {
  assert.equal(resolveCountInCue(5, 4), null);
  assert.equal(resolveCountInCue(4, 3), "tick");
  assert.equal(resolveCountInCue(3, 2), "tick");
  assert.equal(resolveCountInCue(2, 1), "tick");
  assert.equal(resolveCountInCue(1, null), "go");
});

test("does stay quiet on the first reading, a held second, and a cancelled count-in", () => {
  assert.equal(resolveCountInCue(null, 3), null);
  assert.equal(resolveCountInCue(2, 2), null);
  assert.equal(resolveCountInCue(4, null), null);
});
