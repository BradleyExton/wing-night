import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import {
  CREAK_PULL_STEP,
  JOUST_CUE_NAMES,
  JOUST_CUES,
  createJoustSoundboard,
  resolveCreak,
  resolveReplayCues
} from "./index.js";

const shot = {
  run: {
    keyframeHz: 24,
    keyframes: [],
    topples: [
      { pinIndex: 2, frameIndex: 10 },
      { pinIndex: 0, frameIndex: 14 }
    ],
    collapses: [{ perchIndex: 1, frameIndex: 12 }]
  }
};

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...JOUST_CUE_NAMES].sort(), Object.keys(JOUST_CUES).sort());
});

test("does build a graph for every cue when the context is running", () => {
  const stub = createStubAudioContext();
  let nowMs = 0;
  const board = createJoustSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of JOUST_CUE_NAMES) {
    nowMs += 10_000;
    board.play(cue, 0.5);
  }

  assert.ok(stub.startedNodes() >= JOUST_CUE_NAMES.length);
});

test("does creak on a pull back and stay quiet easing off or settling", () => {
  assert.deepEqual(resolveCreak(0.2, 0.5), { intensity: 0.5 });
  assert.equal(resolveCreak(0.5, 0.2), null);
  assert.equal(resolveCreak(0.5, 0.5 + CREAK_PULL_STEP / 2), null);
});

test("does say nothing on the first reading of the band", () => {
  assert.equal(resolveCreak(null, 0.8), null);
});

test("does sound the impacts the replay crossed, in frame order, and none twice", () => {
  assert.deepEqual(resolveReplayCues(shot, -1, 9), []);
  assert.deepEqual(resolveReplayCues(shot, 9, 12), [
    { cue: "topple", frameIndex: 10 },
    { cue: "collapse", frameIndex: 12 }
  ]);
  assert.deepEqual(resolveReplayCues(shot, 12, 20), [{ cue: "topple", frameIndex: 14 }]);
  assert.deepEqual(resolveReplayCues(shot, 20, 20), []);
});

test("does swallow a cue when the page has no AudioContext at all", () => {
  const board = createJoustSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("launch");
  });
});
