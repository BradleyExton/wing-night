import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import {
  BRAWL_CUES,
  BRAWL_CUE_MIN_GAP_MS,
  BRAWL_CUE_NAMES,
  BRAWL_HONK_GOON_INTENSITY,
  BRAWL_SFX_FOLDER,
  createBrawlSoundboard,
  resolveHonkHz,
  resolveHonkSeconds
} from "./index.js";

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...BRAWL_CUE_NAMES].sort(), Object.keys(BRAWL_CUES).sort());
  assert.equal(BRAWL_SFX_FOLDER, "brawl");
});

test("does have a voice and a gap for every cue, and every cue makes a sound", () => {
  let nowMs = 0;
  const stub = createStubAudioContext();
  const board = createBrawlSoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of BRAWL_CUE_NAMES) {
    assert.ok(BRAWL_CUE_MIN_GAP_MS[cue] >= 0, cue);

    const before = stub.startedNodes();

    board.play(cue);
    nowMs += 5000;
    assert.ok(stub.startedNodes() > before, `${cue} started nothing`);
  }
});

test("does lower and lengthen the honk as the goose gets heavier", () => {
  assert.ok(resolveHonkHz(1) < resolveHonkHz(BRAWL_HONK_GOON_INTENSITY));
  assert.ok(resolveHonkHz(BRAWL_HONK_GOON_INTENSITY) < resolveHonkHz(0));
  assert.ok(resolveHonkSeconds(1) > resolveHonkSeconds(BRAWL_HONK_GOON_INTENSITY));
  assert.equal(resolveHonkHz(5), resolveHonkHz(1));
  assert.equal(resolveHonkHz(-2), resolveHonkHz(0));
});

test("does swallow the cue when the page has no AudioContext at all", () => {
  const board = createBrawlSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    for (const cue of BRAWL_CUE_NAMES) {
      board.play(cue);
    }
  });
});

test("does swallow the cue when the context throws on the way out", () => {
  const board = createBrawlSoundboard({
    createContext: () => {
      throw new Error("no audio here");
    }
  });

  assert.doesNotThrow(() => {
    board.play("honk", 1);
  });
});

test("does stay silent and retry when the context has not been unlocked yet", () => {
  const stub = createStubAudioContext("suspended");
  const board = createBrawlSoundboard({ createContext: () => stub.context, now: () => 0 });

  board.play("bell");

  assert.equal(stub.startedNodes(), 0);
  assert.equal(stub.resumeCalls(), 1);
});

test("does sound a cue once when the same cue repeats inside its gap", () => {
  const stub = createStubAudioContext();
  const board = createBrawlSoundboard({ createContext: () => stub.context, now: () => 500 });

  board.play("go");

  const afterFirst = stub.startedNodes();

  board.play("go");

  assert.equal(stub.startedNodes(), afterFirst);
});

test("does start decoding the takes it is handed when the board is made", () => {
  const stub = createStubAudioContext();
  const asked: string[] = [];

  createBrawlSoundboard({
    createContext: () => stub.context,
    takes: { honk: ["http://tv/honk-1.mp3", "http://tv/honk-2.mp3"], bell: ["http://tv/bell-1.mp3"] },
    loadTake: (_context, url) => {
      asked.push(url);

      return Promise.reject(new Error("not decoded in a test"));
    }
  });

  assert.deepEqual(asked, ["http://tv/honk-1.mp3", "http://tv/honk-2.mp3", "http://tv/bell-1.mp3"]);
});

test("does keep a cue on its voice when its take has not decoded", () => {
  const stub = createStubAudioContext();
  const board = createBrawlSoundboard({
    createContext: () => stub.context,
    now: () => 0,
    takes: { peck: ["http://tv/peck-pending.mp3"] },
    loadTake: () => new Promise<AudioBuffer>(() => undefined)
  });

  board.play("peck");

  assert.ok(stub.startedNodes() > 0);
});
