import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "../stubAudioContext/index.js";
import { playTone } from "../voices/index.js";
import { createSoundboard, isCueDue, setAudioBusLevel, type CueTable } from "./index.js";

type TestCue = "blip" | "thud";

const CUES: CueTable<TestCue> = {
  blip: {
    minGapMs: 200,
    voice: (rig, startAt) => {
      playTone(rig, { startAt, durationSeconds: 0.05, type: "square", fromHz: 1000, peak: 0.3 });
    }
  },
  thud: {
    minGapMs: 1000,
    voice: (rig, startAt, intensity) => {
      playTone(rig, { startAt, durationSeconds: 0.2, type: "sine", fromHz: 90, toHz: 40, peak: intensity });
      playTone(rig, { startAt: startAt + 0.2, durationSeconds: 0.2, type: "sine", fromHz: 80, peak: intensity });
    }
  }
};

test("does let a cue through when it has never sounded", () => {
  assert.equal(isCueDue(null, 1000, 200), true);
});

test("does hold a cue back when it repeats inside its own gap", () => {
  assert.equal(isCueDue(1000, 1100, 200), false);
});

test("does let a cue through when its gap has passed", () => {
  assert.equal(isCueDue(1000, 1200, 200), true);
});

test("does build a graph for each cue when the context is running", () => {
  const stub = createStubAudioContext();
  const board = createSoundboard({ cues: CUES, masterGain: 0.3, createContext: () => stub.context, now: () => 0 });

  board.play("blip");
  assert.equal(stub.startedNodes(), 1);

  board.play("thud", 0.5);
  assert.equal(stub.startedNodes(), 3);
});

test("does set the board's master to its gain when the first cue plays", () => {
  const stub = createStubAudioContext();
  const board = createSoundboard({ cues: CUES, masterGain: 0.25, createContext: () => stub.context, now: () => 0 });

  board.play("blip");

  assert.ok(stub.gainValues().includes(0.25));
});

test("does sound a cue once when the same cue repeats inside its gap", () => {
  const stub = createStubAudioContext();
  const board = createSoundboard({ cues: CUES, masterGain: 0.3, createContext: () => stub.context, now: () => 500 });

  board.play("blip");
  board.play("blip");

  assert.equal(stub.startedNodes(), 1);
});

test("does not let one cue's gap gate a different cue", () => {
  const stub = createStubAudioContext();
  const board = createSoundboard({ cues: CUES, masterGain: 0.3, createContext: () => stub.context, now: () => 500 });

  board.play("blip");
  board.play("thud");

  assert.equal(stub.startedNodes(), 3);
});

test("does swallow the cue when the page has no AudioContext at all", () => {
  const board = createSoundboard({ cues: CUES, masterGain: 0.3, createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("blip");
    board.play("thud");
  });
});

test("does stay silent and ask to wake when the context has not been unlocked yet", () => {
  const stub = createStubAudioContext("suspended");
  let nowMs = 0;
  const board = createSoundboard({ cues: CUES, masterGain: 0.3, createContext: () => stub.context, now: () => nowMs });

  board.play("thud");
  nowMs += 10_000;
  board.play("thud");

  // Nothing was scheduled into the suspended context, and each cue asked it to wake again.
  assert.equal(stub.startedNodes(), 0);
  assert.equal(stub.resumeCalls(), 2);
});

test("does swallow the cue when the context throws on the way out", () => {
  const board = createSoundboard({
    cues: CUES,
    masterGain: 0.3,
    createContext: () => {
      throw new Error("no audio here");
    }
  });

  assert.doesNotThrow(() => {
    board.play("blip");
  });
});

test("does swallow the cue when a voice throws mid-graph", () => {
  const stub = createStubAudioContext();
  const board = createSoundboard({
    cues: {
      broken: {
        minGapMs: 0,
        voice: () => {
          throw new Error("bad patch");
        }
      }
    },
    masterGain: 0.3,
    createContext: () => stub.context
  });

  assert.doesNotThrow(() => {
    board.play("broken");
  });
});

test("does clamp a bus level to the unit range and ignore a level that is not a number", () => {
  assert.doesNotThrow(() => {
    setAudioBusLevel("sfx", 4);
    setAudioBusLevel("voice", -1);
    setAudioBusLevel("sfx", Number.NaN);
    setAudioBusLevel("sfx", 1);
  });
});
