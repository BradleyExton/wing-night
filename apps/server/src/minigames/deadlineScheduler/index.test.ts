import assert from "node:assert/strict";
import test from "node:test";

import {
  MINIGAME_DEADLINE_GRACE_MS,
  createMinigameDeadlineScheduler,
  type MinigameDeadline
} from "./index.js";

const DEADLINE: MinigameDeadline = { minigameId: "FAPPY", actionType: "timeOut", atMs: 10_000 };

// A clock and a timer queue the test walks by hand.
const createHarness = (initialDeadline: MinigameDeadline | null) => {
  let clock = 0;
  let deadline = initialDeadline;
  let nextHandle = 0;
  const pending = new Map<number, { callback: () => void; dueAt: number }>();
  const fired: [MinigameDeadline, number][] = [];
  let onFire: (deadline: MinigameDeadline, receivedAtMs: number) => void = () => {};

  const scheduler = createMinigameDeadlineScheduler({
    readDeadline: () => deadline,
    fire: (firedDeadline, receivedAtMs) => {
      fired.push([firedDeadline, receivedAtMs]);
      onFire(firedDeadline, receivedAtMs);
    },
    now: () => clock,
    setTimer: (callback, delayMs) => {
      nextHandle += 1;
      pending.set(nextHandle, { callback, dueAt: clock + delayMs });
      return nextHandle as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer: (handle) => {
      pending.delete(handle as unknown as number);
    }
  });

  // Runs every timer due by `to`, in order, moving the clock to each.
  const advanceTo = (to: number): void => {
    for (;;) {
      const due = [...pending.entries()]
        .filter(([, timer]) => timer.dueAt <= to)
        .sort(([, left], [, right]) => left.dueAt - right.dueAt)[0];

      if (due === undefined) {
        break;
      }

      pending.delete(due[0]);
      clock = due[1].dueAt;
      due[1].callback();
    }

    clock = to;
  };

  return {
    scheduler,
    fired,
    pending,
    advanceTo,
    setDeadline: (next: MinigameDeadline | null): void => {
      deadline = next;
    },
    setOnFire: (handler: typeof onFire): void => {
      onFire = handler;
    },
    setClock: (to: number): void => {
      clock = to;
    }
  };
};

test("does fire a deadline once, just after it passes, stamped with the server's clock", () => {
  const harness = createHarness(DEADLINE);

  harness.setOnFire(() => {
    // The game took it: the deadline is gone, and the broadcast reconciles.
    harness.setDeadline(null);
    harness.scheduler.reconcile();
  });
  harness.scheduler.reconcile();
  harness.advanceTo(DEADLINE.atMs - 1);
  assert.deepEqual(harness.fired, []);

  harness.advanceTo(DEADLINE.atMs + 1_000);

  assert.deepEqual(harness.fired, [[DEADLINE, DEADLINE.atMs + MINIGAME_DEADLINE_GRACE_MS]]);
  assert.equal(harness.pending.size, 0);
});

test("does cancel the timer when the room moves on — a skip, a reset, the phase leaving play", () => {
  const harness = createHarness(DEADLINE);

  harness.scheduler.reconcile();
  harness.setDeadline(null);
  harness.scheduler.reconcile();
  harness.advanceTo(DEADLINE.atMs * 2);

  assert.deepEqual(harness.fired, []);
  assert.equal(harness.pending.size, 0);
});

test("does keep one timer for an unchanged deadline and move it for a new one", () => {
  const harness = createHarness(DEADLINE);
  const later = { ...DEADLINE, atMs: DEADLINE.atMs + 5_000 };

  harness.scheduler.reconcile();
  harness.scheduler.reconcile();
  assert.equal(harness.pending.size, 1);

  harness.setDeadline(later);
  harness.scheduler.reconcile();
  assert.equal(harness.pending.size, 1);

  harness.advanceTo(DEADLINE.atMs + 1_000);
  assert.deepEqual(harness.fired, []);
});

test("does try again after an early wake and never spin on a deadline the game refuses", () => {
  const harness = createHarness(DEADLINE);

  harness.scheduler.reconcile();

  // The timer wakes before the wall clock reaches the deadline: the game refuses, and the
  // scheduler asks again once it really has passed.
  const [first] = [...harness.pending.values()];

  assert.ok(first !== undefined);
  harness.pending.clear();
  harness.setClock(DEADLINE.atMs - 5);
  first.callback();
  assert.equal(harness.pending.size, 1);

  // Past the deadline, the game still refuses (for a reason of its own): one more try, no loop.
  harness.advanceTo(DEADLINE.atMs + 60_000);
  assert.equal(harness.fired.length, 2);
  assert.equal(harness.pending.size, 0);

  // The next broadcast is a fresh room: the same deadline is armed again, as an undo would need.
  harness.scheduler.reconcile();
  assert.equal(harness.pending.size, 1);
});
