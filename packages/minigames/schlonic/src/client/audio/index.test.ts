import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import {
  SCHLONIC_CUE_NAMES,
  SCHLONIC_CUES,
  WING_PITCH_HANDFUL,
  createSchlonicSoundboard,
  resolveWingPitch
} from "./index.js";

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...SCHLONIC_CUE_NAMES].sort(), Object.keys(SCHLONIC_CUES).sort());
});

test("does build a graph for every cue when the context is running", () => {
  const stub = createStubAudioContext();
  let nowMs = 0;
  const board = createSchlonicSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of SCHLONIC_CUE_NAMES) {
    nowMs += 10_000;
    board.play(cue, 0.5);
  }

  assert.ok(stub.startedNodes() >= SCHLONIC_CUE_NAMES.length);
});

test("does climb the wing's pitch with the handful and stop at the top", () => {
  assert.equal(resolveWingPitch(0), 0);
  assert.equal(resolveWingPitch(WING_PITCH_HANDFUL / 2), 0.5);
  assert.equal(resolveWingPitch(WING_PITCH_HANDFUL * 3), 1);
  assert.equal(resolveWingPitch(Number.NaN), 0);
});

test("does swallow a cue when the page has no AudioContext at all", () => {
  const board = createSchlonicSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("wipeout");
  });
});
