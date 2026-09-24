import assert from "node:assert/strict";
import test from "node:test";

import {
  CLOCK_CUE_MIN_GAP_MS,
  createClockSoundboard,
  isClockCueDue
} from "./index";

// The AudioContext is not unit-testable, so the board takes a factory and this
// stands in for one. It records only that the graph was built and started.
type StubAudioContext = {
  context: AudioContext;
  startedNodes: () => number;
  resumeCalls: () => number;
  closeCalls: () => number;
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
  let closeCalls = 0;
  const context = {
    state,
    currentTime: 2,
    sampleRate: 48_000,
    destination: {},
    resume: (): Promise<void> => {
      resumeCalls += 1;
      return Promise.resolve();
    },
    close: (): Promise<void> => {
      closeCalls += 1;
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
    })
  } as unknown as AudioContext;

  return {
    context,
    startedNodes: () => startedNodes,
    resumeCalls: () => resumeCalls,
    closeCalls: () => closeCalls
  };
};

test("does sound a tick and a buzzer when the context is running", () => {
  const stub = createStubContext();
  const board = createClockSoundboard({ createContext: () => stub.context, now: () => 0 });

  board.play("tick");
  const nodesAfterTick = stub.startedNodes();

  assert.ok(nodesAfterTick > 0);

  board.play("timesUp");

  // A different cue, a different voice: the buzzer is more than another tick.
  assert.ok(stub.startedNodes() > nodesAfterTick + 1);
});

test("does never close the context it plays through", () => {
  // The lobby rule: closing a context on the display can mute the room.
  const stub = createStubContext();
  const board = createClockSoundboard({ createContext: () => stub.context, now: () => 0 });

  board.play("tick");
  board.play("timesUp");

  assert.equal(stub.closeCalls(), 0);
});

test("does resume and drop the cue when the context is suspended", () => {
  const stub = createStubContext("suspended");
  const board = createClockSoundboard({ createContext: () => stub.context, now: () => 0 });

  board.play("tick");

  assert.equal(stub.resumeCalls(), 1);
  assert.equal(stub.startedNodes(), 0);
});

test("does stay silent when there is no audio context at all", () => {
  const board = createClockSoundboard({ createContext: () => null });

  assert.doesNotThrow(() => {
    board.play("tick");
    board.play("timesUp");
  });
});

test("does play one tick when two renders land on the same second", () => {
  let nowMs = 0;
  const stub = createStubContext();
  const board = createClockSoundboard({ createContext: () => stub.context, now: () => nowMs });

  board.play("tick");
  const nodesAfterFirst = stub.startedNodes();

  nowMs = CLOCK_CUE_MIN_GAP_MS.tick - 1;
  board.play("tick");

  assert.equal(stub.startedNodes(), nodesAfterFirst);

  nowMs = CLOCK_CUE_MIN_GAP_MS.tick;
  board.play("tick");

  assert.ok(stub.startedNodes() > nodesAfterFirst);
});

test("does swallow a context that throws rather than break the stage", () => {
  const board = createClockSoundboard({
    createContext: () => {
      throw new Error("no audio");
    }
  });

  assert.doesNotThrow(() => board.play("timesUp"));
});

test("does treat a cue as due on its first play and after its gap", () => {
  assert.equal(isClockCueDue(null, 0, 250), true);
  assert.equal(isClockCueDue(0, 249, 250), false);
  assert.equal(isClockCueDue(0, 250, 250), true);
});
