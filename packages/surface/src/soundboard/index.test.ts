import assert from "node:assert/strict";
import test from "node:test";

import { createSoundboard, isCueDue, playNoise, playTone } from "./index.js";

// The AudioContext is not unit-testable, so the board takes a factory and this stands in for
// one. It records nothing about the sound — only that the graph was built without throwing.
const createStubParam = (): AudioParam => {
  const param = {
    value: 0,
    setValueAtTime: (): AudioParam => param,
    linearRampToValueAtTime: (): AudioParam => param,
    exponentialRampToValueAtTime: (): AudioParam => param
  } as unknown as AudioParam;

  return param;
};

const createStubContext = (
  state: AudioContextState = "running"
): { context: AudioContext; startedNodes: () => number; resumeCalls: () => number } => {
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

type Cue = "blip" | "thud";

const createBoard = (
  stub: ReturnType<typeof createStubContext>,
  clock: { nowMs: number }
): ReturnType<typeof createSoundboard<Cue>> => {
  return createSoundboard<Cue>({
    voices: {
      blip: (context, rig, startAt) => {
        playTone(context, rig, { startAt, durationSeconds: 0.05, type: "sine", fromHz: 800, peak: 0.2 });
      },
      thud: (context, rig, startAt) => {
        playNoise(context, rig, { startAt, durationSeconds: 0.1, peak: 0.5, filterType: "lowpass", fromHz: 400 });
        playTone(context, rig, { startAt, durationSeconds: 0.1, type: "sine", fromHz: 100, toHz: 40, peak: 0.5 });
      }
    },
    minGapMs: { blip: 50, thud: 200 },
    masterGain: 0.25,
    createContext: () => stub.context,
    now: () => clock.nowMs
  });
};

test("does build a voice's graph on a running context", () => {
  const stub = createStubContext();
  const board = createBoard(stub, { nowMs: 0 });

  board.play("blip");
  board.play("thud");

  assert.equal(stub.startedNodes(), 3);
});

test("does hold a cue to its own gap and never another cue's", () => {
  const stub = createStubContext();
  const clock = { nowMs: 0 };
  const board = createBoard(stub, clock);

  board.play("blip");
  clock.nowMs = 20;
  board.play("blip");
  board.play("thud");
  clock.nowMs = 60;
  board.play("blip");

  assert.equal(stub.startedNodes(), 4);
  assert.equal(isCueDue(0, 49, 50), false);
  assert.equal(isCueDue(0, 50, 50), true);
  assert.equal(isCueDue(null, 0, 50), true);
});

test("does ask a suspended context to resume and schedules nothing into it", () => {
  const stub = createStubContext("suspended");
  const board = createBoard(stub, { nowMs: 0 });

  board.play("blip");

  assert.equal(stub.resumeCalls(), 1);
  assert.equal(stub.startedNodes(), 0);
});

test("does stay silent rather than throw when there is no context to be had", () => {
  const board = createSoundboard<Cue>({
    voices: { blip: () => undefined, thud: () => undefined },
    minGapMs: { blip: 0, thud: 0 },
    masterGain: 0.2,
    createContext: () => {
      throw new Error("no audio here");
    }
  });

  assert.doesNotThrow(() => board.play("blip"));
});
