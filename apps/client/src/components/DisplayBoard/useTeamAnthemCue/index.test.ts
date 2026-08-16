import { Phase } from "@wingnight/shared";
import assert from "node:assert/strict";
import test from "node:test";

import { shouldStartTeamAnthem, shouldStopTeamAnthem } from "./index";

test("starts the anthem on entry to MINIGAME_INTRO for a team with anthems", () => {
  assert.equal(
    shouldStartTeamAnthem(Phase.EATING, Phase.MINIGAME_INTRO, true),
    true
  );
});

// The double-fire shape. A predicate written as `phase === MINIGAME_INTRO &&
// hasAnthems` passes every other case here and fails only this one — which is
// exactly why it is worth its own test.
test("does not re-start the anthem when already at MINIGAME_INTRO", () => {
  assert.equal(
    shouldStartTeamAnthem(Phase.MINIGAME_INTRO, Phase.MINIGAME_INTRO, true),
    false
  );
});

test("does not start the anthem at MINIGAME_INTRO for a team with no anthems", () => {
  assert.equal(
    shouldStartTeamAnthem(Phase.EATING, Phase.MINIGAME_INTRO, false),
    false
  );
});

test("does not start the anthem on a transition that never reaches MINIGAME_INTRO", () => {
  assert.equal(
    shouldStartTeamAnthem(Phase.INTRO, Phase.ROUND_INTRO, true),
    false
  );
});

// Asserted across every phase the display can hold, so a cancel predicate
// narrowed to one specific successor phase goes red.
test("stops the anthem whenever the phase leaves MINIGAME_INTRO", () => {
  const phasesAfterLeaving: (Phase | null)[] = [
    Phase.SETUP,
    Phase.INTRO,
    Phase.ROUND_INTRO,
    Phase.EATING,
    Phase.MINIGAME_PLAY,
    null
  ];

  for (const phase of phasesAfterLeaving) {
    assert.equal(shouldStopTeamAnthem(phase), true);
  }
});

test("keeps the anthem running while the phase is still MINIGAME_INTRO", () => {
  assert.equal(shouldStopTeamAnthem(Phase.MINIGAME_INTRO), false);
});
