import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import {
  SCHLONIC_CUE_MIN_GAP_MS,
  SCHLONIC_CUE_NAMES,
  WING_CHIME_TOP_AT,
  createSchlonicSoundboard,
  resolveWingChimeHz
} from "./index.js";

const createStubContext = createStubAudioContext;

test("does have a voice and a gap for every cue, and every cue makes a sound", () => {
  let nowMs = 0;
  const stub = createStubContext();
  const board = createSchlonicSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of SCHLONIC_CUE_NAMES) {
    assert.ok(SCHLONIC_CUE_MIN_GAP_MS[cue] >= 0, cue);

    const before = stub.startedNodes();

    board.play(cue);
    nowMs += 5000;
    assert.ok(stub.startedNodes() > before, `${cue} started nothing`);
  }
});

test("does climb the wing chime with the handful and stop climbing at the top", () => {
  assert.ok(resolveWingChimeHz(0) < resolveWingChimeHz(10));
  assert.ok(resolveWingChimeHz(10) < resolveWingChimeHz(WING_CHIME_TOP_AT));
  assert.equal(resolveWingChimeHz(WING_CHIME_TOP_AT), resolveWingChimeHz(WING_CHIME_TOP_AT * 3));
  assert.equal(resolveWingChimeHz(-4), resolveWingChimeHz(0));
});
