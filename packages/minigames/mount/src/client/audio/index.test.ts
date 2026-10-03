import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import { MOUNT_CUES, MOUNT_CUE_MIN_GAP_MS, MOUNT_CUE_NAMES, MOUNT_SFX_FOLDER, createMountSoundboard } from "./index.js";

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...MOUNT_CUE_NAMES].sort(), Object.keys(MOUNT_CUES).sort());
  assert.equal(MOUNT_SFX_FOLDER, "mount");
});

test("does make a sound for every cue when the board can sound", () => {
  let nowMs = 0;
  const stub = createStubAudioContext();
  const board = createMountSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of MOUNT_CUE_NAMES) {
    assert.ok(MOUNT_CUE_MIN_GAP_MS[cue] >= 0, cue);

    const before = stub.startedNodes();

    board.play(cue);
    nowMs += 5000;
    assert.ok(stub.startedNodes() > before, `${cue} started nothing`);
  }
});

test("does swallow every cue when the page has no AudioContext", () => {
  const board = createMountSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    for (const cue of MOUNT_CUE_NAMES) {
      board.play(cue);
    }
  });
});
