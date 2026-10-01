import { useCallback, useEffect, useRef, useState } from "react";

// How long a verdict holds its buttons down. A double tap's second tap lands
// well inside it; a deliberate second verdict is a beat the room has to hear
// first — a question read out, a sketch guessed — which is seconds, never this.
export const VERDICT_SETTLE_MS = 400;

type VerdictGateTimers = {
  setTimer: (onElapsed: () => void, delayMs: number) => unknown;
  clearTimer: (timer: unknown) => void;
};

type VerdictGate = {
  // Runs `send` and closes the gate, or does nothing while it is closed.
  pass: (send: () => void) => void;
  dispose: () => void;
};

// The gate itself, apart from React so it can be tested against fake timers:
// one verdict through, then nothing until `settleMs` has passed. It answers
// synchronously rather than through React state, because two taps can land
// before the render that would disable the buttons.
export const createVerdictGate = (
  timers: VerdictGateTimers,
  onSettlingChange: (isSettling: boolean) => void,
  settleMs: number = VERDICT_SETTLE_MS
): VerdictGate => {
  let settleTimer: unknown = null;

  return {
    pass: (send): void => {
      if (settleTimer !== null) {
        return;
      }

      settleTimer = timers.setTimer(() => {
        settleTimer = null;
        onSettlingChange(false);
      }, settleMs);
      onSettlingChange(true);
      send();
    },
    dispose: (): void => {
      if (settleTimer !== null) {
        timers.clearTimer(settleTimer);
        settleTimer = null;
      }
    }
  };
};

const browserTimers: VerdictGateTimers = {
  setTimer: (onElapsed, delayMs) => setTimeout(onElapsed, delayMs),
  clearTimer: (timer) => {
    clearTimeout(timer as ReturnType<typeof setTimeout>);
  }
};

// A host surface's verdict buttons — Correct, Skip, Lock it in, Next — sent
// through one gate, so a double tap is one verdict. Without it the second tap
// landed after the first had already dealt the next question and scored THAT
// one too: the server cannot tell a repeat from a real second verdict, because
// by the time it arrives the tablet is showing the new item and says so. One
// gate per surface rather than per button, because a reveal can put the next
// button under the same finger (GEO's "Lock it in" becomes "Next photo").
//
// `isSettling` is for the buttons' `disabled`: they dim for the moment the
// gate is shut, which is the host's sign the tap registered, and a disabled
// button cannot be tapped at all.
//
// Only for verdicts. A stroke, an emoji typed twice or a flap is meant to
// repeat, so those keep the surface's plain `onDispatchAction`.
export const useVerdictDispatch = <Args extends unknown[]>(
  dispatch: (...args: Args) => void
): { dispatchVerdict: (...args: Args) => void; isSettling: boolean } => {
  const [isSettling, setIsSettling] = useState(false);
  const gateRef = useRef<VerdictGate | null>(null);

  useEffect(() => {
    return (): void => {
      gateRef.current?.dispose();
      gateRef.current = null;
    };
  }, []);

  const dispatchVerdict = useCallback(
    (...args: Args): void => {
      gateRef.current ??= createVerdictGate(browserTimers, setIsSettling);
      gateRef.current.pass(() => {
        dispatch(...args);
      });
    },
    [dispatch]
  );

  return { dispatchVerdict, isSettling };
};
