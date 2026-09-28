import assert from "node:assert/strict";
import test from "node:test";

import { createStubAudioContext } from "@wingnight/audio";

import {
  FAPPY_CUE_NAMES,
  FAPPY_CUES,
  FAPPY_HEARTBEAT_REMAINING_MS,
  HEARTBEAT_GAIN_FLOOR,
  createFappySoundboard,
  resolveClockCue,
  resolveHeartbeatGain
} from "./index.js";

test("does sit at the floor when the heartbeat has no urgency yet", () => {
  assert.equal(resolveHeartbeatGain(0), HEARTBEAT_GAIN_FLOOR);
});

test("does reach full gain when the heartbeat is out of time", () => {
  assert.equal(resolveHeartbeatGain(1), 1);
});

test("does rise between the floor and full when the urgency is halfway", () => {
  assert.equal(resolveHeartbeatGain(0.5), HEARTBEAT_GAIN_FLOOR + (1 - HEARTBEAT_GAIN_FLOOR) / 2);
});

test("does clamp the heartbeat's gain when urgency runs past either end", () => {
  assert.equal(resolveHeartbeatGain(-3), HEARTBEAT_GAIN_FLOOR);
  assert.equal(resolveHeartbeatGain(4), 1);
  assert.equal(resolveHeartbeatGain(Number.NaN), HEARTBEAT_GAIN_FLOOR);
});

test("does stay silent when the relay is still inside par", () => {
  const cue = resolveClockCue({ elapsedMs: 10_000, parSeconds: 30, limitSeconds: 90 });

  assert.deepEqual(cue, { cue: null, second: 10, urgency: 0 });
});

test("does tick on the second when the relay runs past par", () => {
  assert.deepEqual(resolveClockCue({ elapsedMs: 30_000, parSeconds: 30, limitSeconds: 90 }), {
    cue: "tick",
    second: 30,
    urgency: 0
  });
  assert.deepEqual(resolveClockCue({ elapsedMs: 31_400, parSeconds: 30, limitSeconds: 90 }), {
    cue: "tick",
    second: 31,
    urgency: 0
  });
});

test("does replace the tick with a heartbeat when the last fifteen seconds open", () => {
  const cue = resolveClockCue({ elapsedMs: 75_000, parSeconds: 30, limitSeconds: 90 });

  assert.equal(cue.cue, "heartbeat");
  assert.equal(cue.second, 75);
  assert.equal(cue.urgency, 0);
});

test("does drive the heartbeat's urgency towards one when the limit closes", () => {
  const cue = resolveClockCue({ elapsedMs: 89_000, parSeconds: 30, limitSeconds: 90 });

  assert.equal(cue.cue, "heartbeat");
  assert.equal(cue.urgency, 1 - 1000 / FAPPY_HEARTBEAT_REMAINING_MS);
});

test("does beat rather than tick when par sits inside the final stretch", () => {
  assert.equal(resolveClockCue({ elapsedMs: 12_000, parSeconds: 10, limitSeconds: 20 }).cue, "heartbeat");
});

test("does fall quiet when the limit is spent", () => {
  assert.deepEqual(resolveClockCue({ elapsedMs: 90_000, parSeconds: 30, limitSeconds: 90 }), {
    cue: null,
    second: 90,
    urgency: 1
  });
});

test("does say nothing when the elapsed time is not a usable number", () => {
  assert.equal(resolveClockCue({ elapsedMs: -5, parSeconds: 30, limitSeconds: 90 }).cue, null);
  assert.equal(resolveClockCue({ elapsedMs: Number.NaN, parSeconds: 30, limitSeconds: 90 }).cue, null);
});

test("does name every cue in the table once in the list the tests walk", () => {
  assert.deepEqual([...FAPPY_CUE_NAMES].sort(), Object.keys(FAPPY_CUES).sort());
});

test("does build a graph for every cue when the context is running", () => {
  const stub = createStubAudioContext();
  let nowMs = 0;
  const board = createFappySoundboard({ createContext: () => stub.context, now: () => nowMs });

  for (const cue of FAPPY_CUE_NAMES) {
    nowMs += 10_000;
    board.play(cue, 0.5);
  }

  assert.ok(stub.startedNodes() >= FAPPY_CUE_NAMES.length);
});

test("does swallow the cue when the page has no AudioContext at all", () => {
  const board = createFappySoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("flap");
    board.play("crash");
  });
});

test("does stay silent and retry when the context has not been unlocked yet", () => {
  const stub = createStubAudioContext("suspended");
  let nowMs = 0;
  const board = createFappySoundboard({ createContext: () => stub.context, now: () => nowMs });

  board.play("finish");
  nowMs += 10_000;
  board.play("finish");

  // Nothing was scheduled into the suspended context, and each cue asked it to wake again.
  assert.equal(stub.startedNodes(), 0);
  assert.equal(stub.resumeCalls(), 2);
});

test("does swallow the cue when the context throws on the way out", () => {
  const board = createFappySoundboard({
    createContext: () => {
      throw new Error("no audio here");
    }
  });

  assert.doesNotThrow(() => {
    board.play("heartbeat", 1);
  });
});

test("does sound a cue once when the same cue repeats inside its gap", () => {
  const stub = createStubAudioContext();
  const board = createFappySoundboard({ createContext: () => stub.context, now: () => 500 });

  board.play("handoff");

  const afterFirst = stub.startedNodes();

  board.play("handoff");

  assert.equal(stub.startedNodes(), afterFirst);
});
