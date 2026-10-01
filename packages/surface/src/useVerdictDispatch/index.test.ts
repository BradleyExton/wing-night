import assert from "node:assert/strict";
import test from "node:test";

import { createVerdictGate, VERDICT_SETTLE_MS } from "./index.js";

type FakeTimer = { onElapsed: () => void; dueAtMs: number; isCleared: boolean };

const createFakeTimers = (): {
  setTimer: (onElapsed: () => void, delayMs: number) => unknown;
  clearTimer: (timer: unknown) => void;
  advance: (ms: number) => void;
} => {
  let nowMs = 0;
  const pending: FakeTimer[] = [];

  return {
    setTimer: (onElapsed, delayMs) => {
      const timer: FakeTimer = { onElapsed, dueAtMs: nowMs + delayMs, isCleared: false };
      pending.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      (timer as FakeTimer).isCleared = true;
    },
    advance: (ms) => {
      nowMs += ms;

      for (const timer of pending.splice(0)) {
        if (timer.isCleared) {
          continue;
        }

        if (timer.dueAtMs <= nowMs) {
          timer.onElapsed();
        } else {
          pending.push(timer);
        }
      }
    }
  };
};

const createProbe = (): {
  gate: ReturnType<typeof createVerdictGate>;
  timers: ReturnType<typeof createFakeTimers>;
  sent: string[];
  settling: boolean[];
} => {
  const timers = createFakeTimers();
  const sent: string[] = [];
  const settling: boolean[] = [];
  const gate = createVerdictGate(timers, (isSettling) => {
    settling.push(isSettling);
  });

  return { gate, timers, sent, settling };
};

test("does send the first verdict and report the gate shut", () => {
  const { gate, sent, settling } = createProbe();

  gate.pass(() => sent.push("correct"));

  assert.deepEqual(sent, ["correct"]);
  assert.deepEqual(settling, [true]);
});

test("does drop the second tap of a double tap", () => {
  const { gate, timers, sent } = createProbe();

  gate.pass(() => sent.push("first"));
  timers.advance(150);
  gate.pass(() => sent.push("second"));

  assert.deepEqual(sent, ["first"]);
});

test("does open the gate again once the verdict has settled", () => {
  const { gate, timers, sent, settling } = createProbe();

  gate.pass(() => sent.push("first"));
  timers.advance(VERDICT_SETTLE_MS);
  gate.pass(() => sent.push("second"));

  assert.deepEqual(sent, ["first", "second"]);
  assert.deepEqual(settling, [true, false, true]);
});

test("does report nothing after it is disposed mid-settle", () => {
  const { gate, timers, settling } = createProbe();

  gate.pass(() => undefined);
  gate.dispose();
  timers.advance(VERDICT_SETTLE_MS);

  assert.deepEqual(settling, [true]);
});
