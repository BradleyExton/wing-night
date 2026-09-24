import assert from "node:assert/strict";
import test from "node:test";

import {
  FAPPY_CUE_NAMES,
  FAPPY_HEARTBEAT_REMAINING_MS,
  HEARTBEAT_GAIN_FLOOR,
  createFappySoundboard,
  isCueDue,
  resolveClockCue,
  resolveHeartbeatGain
} from "./index.js";

// The AudioContext is not unit-testable, so the board takes a factory and these stand in for
// one. They record nothing about the sound — only that the graph was built without throwing.
type StubAudioContext = {
  context: AudioContext;
  startedNodes: () => number;
  resumeCalls: () => number;
};

const createStubParam = (): AudioParam => {
  const param = {
    value: 0,
    setValueAtTime: (): AudioParam => param,
    linearRampToValueAtTime: (): AudioParam => param,
    exponentialRampToValueAtTime: (): AudioParam => param
  } as unknown as AudioParam;

  return param;
};

const createStubContext = (state: AudioContextState = "running"): StubAudioContext => {
  let startedNodes = 0;
  let resumeCalls = 0;
  const context = {
    state,
    currentTime: 2,
    sampleRate: 48_000,
    destination: {},
    resume: (): Promise<void> => {
      resumeCalls += 1;
      return Promise.resolve();
    },
    createGain: () => ({ gain: createStubParam(), connect: (): void => undefined }),
    createOscillator: () => ({
      type: "sine",
      frequency: createStubParam(),
      connect: (): void => undefined,
      start: (): void => {
        startedNodes += 1;
      },
      stop: (): void => undefined
    }),
    createBufferSource: () => ({
      buffer: null,
      connect: (): void => undefined,
      start: (): void => {
        startedNodes += 1;
      },
      stop: (): void => undefined
    }),
    createBiquadFilter: () => ({
      type: "lowpass",
      frequency: createStubParam(),
      Q: createStubParam(),
      connect: (): void => undefined
    }),
    createBuffer: (_channels: number, frameCount: number) => ({
      getChannelData: (): Float32Array => new Float32Array(frameCount)
    })
  } as unknown as AudioContext;

  return { context, startedNodes: () => startedNodes, resumeCalls: () => resumeCalls };
};

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

test("does let a cue through when it has never sounded", () => {
  assert.equal(isCueDue(null, 1000, 200), true);
});

test("does hold a cue back when it repeats inside its own gap", () => {
  assert.equal(isCueDue(1000, 1100, 200), false);
});

test("does let a cue through when its gap has passed", () => {
  assert.equal(isCueDue(1000, 1200, 200), true);
});

test("does build a graph for every cue when the context is running", () => {
  const stub = createStubContext();
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
  const stub = createStubContext("suspended");
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
  const stub = createStubContext();
  const board = createFappySoundboard({ createContext: () => stub.context, now: () => 500 });

  board.play("handoff");

  const afterFirst = stub.startedNodes();

  board.play("handoff");

  assert.equal(stub.startedNodes(), afterFirst);
});
