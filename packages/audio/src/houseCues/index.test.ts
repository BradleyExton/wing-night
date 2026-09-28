import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "../stubAudioContext/index.js";
import { HOUSE_CUE_NAMES, HOUSE_CUES, createHouseSoundboard } from "./index.js";

test("does build a graph for every house cue when the context is running", () => {
  const stub = createStubAudioContext();
  let nowMs = 0;
  const board = createHouseSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of HOUSE_CUE_NAMES) {
    nowMs += 10_000;
    board.play(cue);
  }

  assert.ok(stub.startedNodes() >= HOUSE_CUE_NAMES.length);
});

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...HOUSE_CUE_NAMES].sort(), Object.keys(HOUSE_CUES).sort());
});

test("does keep a hit and a miss from stacking on themselves in one render", () => {
  const stub = createStubAudioContext();
  const board = createHouseSoundboard({ createContext: () => stub.context, now: () => 0 });

  board.play("hit");
  const afterFirst = stub.startedNodes();
  board.play("hit");

  assert.equal(stub.startedNodes(), afterFirst);
});

test("does swallow a house cue when the page has no AudioContext at all", () => {
  const board = createHouseSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("timesUp");
  });
});
