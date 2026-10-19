import assert from "node:assert/strict";
import test from "node:test";

import { createBeatLoop, type BeatFrameClock } from "./index.js";

// A frame clock stepped by hand: `frame(at)` runs every step queued for the next frame.
const createManualClock = (): BeatFrameClock & {
  setNow: (nowMs: number) => void;
  frame: (nowMs: number) => void;
  pending: () => number;
} => {
  let nowMs = 0;
  let nextHandle = 1;
  const queued = new Map<number, (now: number) => void>();

  return {
    now: () => nowMs,
    requestFrame: (step) => {
      const handle = nextHandle;

      nextHandle += 1;
      queued.set(handle, step);
      return handle;
    },
    cancelFrame: (handle) => {
      queued.delete(handle);
    },
    setNow: (at) => {
      nowMs = at;
    },
    frame: (at) => {
      nowMs = at;

      const steps = [...queued.values()];

      queued.clear();

      for (const step of steps) {
        step(at);
      }
    },
    pending: () => queued.size
  };
};

const DURATIONS = { crash: 400, handoff: 1000 };

test("does paint progress from 0 to 1 over the kind's duration when a beat plays out", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const painted: number[] = [];

  clock.setNow(100);
  beats.start("crash", (progress) => painted.push(progress));
  clock.frame(200);
  clock.frame(400);
  clock.frame(600);

  assert.deepEqual(painted, [0, 0.25, 0.75, 1]);
  assert.equal(clock.pending(), 0);
  assert.equal(beats.current(), null);
});

test("does clamp the last paint to 1 when a frame lands past the end", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const painted: number[] = [];

  beats.start("handoff", (progress) => painted.push(progress));
  clock.frame(5000);

  assert.deepEqual(painted, [0, 1]);
});

test("does run then once when the beat reaches its end, after it stops being current", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const seenCurrent: unknown[] = [];
  const beat = beats.start("crash", () => undefined);

  beat.then = (): void => {
    seenCurrent.push(beats.current());
  };
  clock.frame(200);

  assert.deepEqual(seenCurrent, []);

  clock.frame(400);

  assert.deepEqual(seenCurrent, [null]);
});

test("does report the playing beat as current until it ends", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const beat = beats.start("handoff", () => undefined);

  assert.equal(beats.current(), beat);
  assert.equal(beats.current()?.kind, "handoff");
});

test("does cancel the frame and skip then when the beat is stopped", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const painted: number[] = [];
  let thenRuns = 0;
  const beat = beats.start("crash", (progress) => painted.push(progress));

  beat.then = (): void => {
    thenRuns += 1;
  };
  beats.stop();
  clock.frame(1000);

  assert.deepEqual(painted, [0]);
  assert.equal(thenRuns, 0);
  assert.equal(clock.pending(), 0);
  assert.equal(beats.current(), null);
});

test("does stop the playing beat when a new one starts", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const crashPaints: number[] = [];
  const handoffPaints: number[] = [];
  let crashThenRuns = 0;
  const crash = beats.start("crash", (progress) => crashPaints.push(progress));

  crash.then = (): void => {
    crashThenRuns += 1;
  };
  clock.setNow(0);
  beats.start("handoff", (progress) => handoffPaints.push(progress));
  clock.frame(500);

  assert.deepEqual(crashPaints, [0]);
  assert.deepEqual(handoffPaints, [0, 0.5]);
  assert.equal(crashThenRuns, 0);
  assert.equal(beats.current()?.kind, "handoff");
});

test("does let then start the next beat", () => {
  const clock = createManualClock();
  const beats = createBeatLoop(DURATIONS, clock);
  const first = beats.start("crash", () => undefined);

  first.then = (): void => {
    beats.start("handoff", () => undefined);
  };
  clock.frame(400);

  assert.equal(beats.current()?.kind, "handoff");
  assert.equal(clock.pending(), 1);
});
