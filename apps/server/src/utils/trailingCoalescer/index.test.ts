import assert from "node:assert/strict";
import test from "node:test";

import { createTrailingCoalescer, type CoalescerTimers } from "./index.js";

const createManualTimers = () => {
  const queued: { run: () => void; ms: number }[] = [];
  const timers: CoalescerTimers = {
    setTimeout: (run, ms) => {
      const entry = { run, ms };

      queued.push(entry);

      return entry;
    },
    clearTimeout: (handle) => {
      queued.splice(queued.indexOf(handle as (typeof queued)[number]), 1);
    }
  };

  return {
    timers,
    queued,
    fire: (): void => {
      queued.shift()?.run();
    }
  };
};

test("does fold every schedule inside the window into one trailing run", () => {
  const manual = createManualTimers();
  let runs = 0;
  const coalescer = createTrailingCoalescer(() => {
    runs += 1;
  }, 100, manual.timers);

  for (let index = 0; index < 300; index += 1) {
    coalescer.schedule();
  }

  assert.equal(manual.queued.length, 1);
  assert.equal(manual.queued[0]?.ms, 100);
  assert.equal(runs, 0);

  manual.fire();
  assert.equal(runs, 1);

  coalescer.schedule();
  manual.fire();
  assert.equal(runs, 2);
});

test("does drop the pending run when it is cancelled", () => {
  const manual = createManualTimers();
  let runs = 0;
  const coalescer = createTrailingCoalescer(() => {
    runs += 1;
  }, 100, manual.timers);

  coalescer.schedule();
  coalescer.cancel();

  assert.equal(manual.queued.length, 0);
  assert.equal(runs, 0);
});

test("does run at once and drop the pending run when it is flushed", () => {
  const manual = createManualTimers();
  let runs = 0;
  const coalescer = createTrailingCoalescer(() => {
    runs += 1;
  }, 100, manual.timers);

  coalescer.schedule();
  coalescer.flush();

  assert.equal(runs, 1);
  assert.equal(manual.queued.length, 0);

  coalescer.flush();
  assert.equal(runs, 2);
});
