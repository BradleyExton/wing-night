// Runs `run` at most once per `windowMs`, on the trailing edge: the first
// `schedule` arms a timer, every `schedule` before it fires folds into that
// one run. Timers are injected so a test can fire them by hand.
export type CoalescerTimers = {
  setTimeout: (run: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

export type TrailingCoalescer = {
  schedule: () => void;
  // Drops a pending run, for a server shutting down.
  cancel: () => void;
};

const nodeTimers: CoalescerTimers = {
  setTimeout: (run, ms) => {
    const handle = setTimeout(run, ms);

    // A pending broadcast must not hold a closing server open.
    handle.unref();

    return handle;
  },
  clearTimeout: (handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  }
};

export const createTrailingCoalescer = (
  run: () => void,
  windowMs: number,
  timers: CoalescerTimers = nodeTimers
): TrailingCoalescer => {
  let pending: unknown = null;

  return {
    schedule: (): void => {
      if (pending !== null) {
        return;
      }

      pending = timers.setTimeout(() => {
        pending = null;
        run();
      }, windowMs);
    },
    cancel: (): void => {
      if (pending !== null) {
        timers.clearTimeout(pending);
        pending = null;
      }
    }
  };
};
