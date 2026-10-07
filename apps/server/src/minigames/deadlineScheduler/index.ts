import type { MinigameType } from "@wingnight/shared";

export type MinigameDeadline = {
  minigameId: MinigameType;
  actionType: string;
  atMs: number;
};

type TimerHandle = ReturnType<typeof setTimeout>;

export type MinigameDeadlineSchedulerOptions = {
  // The deadline the room wants enforced right now (`readMinigameDeadline`), or null.
  readDeadline: () => MinigameDeadline | null;
  // Sends the deadline's action, stamped with `receivedAtMs` — the scheduler's own clock.
  fire: (deadline: MinigameDeadline, receivedAtMs: number) => void;
  // Injected so a test walks the clock instead of waiting for it.
  now?: () => number;
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer?: (handle: TimerHandle) => void;
};

// Fired this long after the deadline, never before it: a timer is allowed to wake a millisecond
// early by the wall clock, and a game refuses a deadline action that is early.
export const MINIGAME_DEADLINE_GRACE_MS = 25;

const isSameDeadline = (left: MinigameDeadline, right: MinigameDeadline): boolean => {
  return (
    left.minigameId === right.minigameId &&
    left.actionType === right.actionType &&
    left.atMs === right.atMs
  );
};

// The server's own clock for a game's deadline (`MinigameRuntimePlugin.selectDeadlineAction`):
// FAPPY's relay limit, which has to land whether or not the device flying the leg is still in the
// room. `reconcile` runs after every broadcast, so whatever moved the room — a skip, a reset, an
// undo, the phase leaving play — re-reads the deadline: a different one is rescheduled, none is
// cancelled. One timer, at most, per server.
export const createMinigameDeadlineScheduler = ({
  readDeadline,
  fire,
  now = Date.now,
  setTimer = setTimeout,
  clearTimer = clearTimeout
}: MinigameDeadlineSchedulerOptions) => {
  let scheduled: { deadline: MinigameDeadline; handle: TimerHandle } | null = null;
  // The deadline just fired, while the room has not moved since. If the game still asks for it,
  // it refused the action for a reason of its own, and firing it again would only spin; the next
  // broadcast clears it. An early wake is the one refusal worth a second try.
  let lastFired: MinigameDeadline | null = null;

  const cancel = (): void => {
    if (scheduled !== null) {
      clearTimer(scheduled.handle);
      scheduled = null;
    }
  };

  const schedule = (): void => {
    const deadline = readDeadline();

    if (deadline === null) {
      cancel();
      return;
    }

    if (scheduled !== null && isSameDeadline(scheduled.deadline, deadline)) {
      return;
    }

    cancel();

    if (lastFired !== null && isSameDeadline(lastFired, deadline) && now() >= deadline.atMs) {
      return;
    }

    const handle = setTimer(
      () => {
        scheduled = null;
        // A deadline that lands broadcasts, and the broadcast reconciles on its own.
        fire(deadline, now());
        lastFired = deadline;
        schedule();
      },
      Math.max(0, deadline.atMs - now()) + MINIGAME_DEADLINE_GRACE_MS
    );

    scheduled = { deadline, handle };
  };

  // After every broadcast: the room moved, so whatever was fired before is history (an undo of a
  // timed-out relay puts the same deadline back, and it lands again — as the tablet's clock would).
  const reconcile = (): void => {
    lastFired = null;
    schedule();
  };

  return { reconcile, cancel };
};

export type MinigameDeadlineScheduler = ReturnType<typeof createMinigameDeadlineScheduler>;
