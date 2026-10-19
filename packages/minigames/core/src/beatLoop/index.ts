// Where a beat reads the time and asks for its next frame. The browser's by default; a test
// passes its own so it can step frames by hand.
export type BeatFrameClock = {
  now: () => number;
  requestFrame: (step: (now: number) => void) => number;
  cancelFrame: (handle: number) => void;
};

// A beat as the caller holds it: what kind is playing, and what runs once it has played to the
// end — the next run the server has already moved to, held back until the room has seen how
// this one went. `then` never runs for a beat that is stopped.
export type Beat<Kind extends string> = {
  readonly kind: Kind;
  then: (() => void) | null;
};

export type BeatLoop<Kind extends string> = {
  // Plays one beat, painted every animation frame with its progress 0 → 1. Whatever beat was
  // playing is stopped first.
  start: (kind: Kind, paintBeat: (progress: number) => void) => Beat<Kind>;
  stop: () => void;
  current: () => Beat<Kind> | null;
};

type PlayingBeat<Kind extends string> = Beat<Kind> & {
  startedAtMs: number;
  rafHandle: number;
};

const browserFrameClock: BeatFrameClock = {
  now: () => performance.now(),
  requestFrame: (step) => window.requestAnimationFrame(step),
  cancelFrame: (handle) => window.cancelAnimationFrame(handle)
};

// The fixed-length beat a one-button game plays over a run's terminal frame — the crash, the
// landing, the post — shared by the tablet's runner and the TV's mirror. Only the painting
// differs between them, so that is all a caller hands in.
//
// The loop lives outside React: a hook keeps one for its lifetime and stops it on purpose — when
// a new run or a still frame replaces it, or on unmount — never from an effect's cleanup, so a
// beat the tablet has already moved past still plays out on the wall.
export const createBeatLoop = <Kind extends string>(
  durationMs: Readonly<Record<Kind, number>>,
  clock: BeatFrameClock = browserFrameClock
): BeatLoop<Kind> => {
  let playing: PlayingBeat<Kind> | null = null;

  const stop = (): void => {
    if (playing !== null && playing.rafHandle !== 0) {
      clock.cancelFrame(playing.rafHandle);
    }

    playing = null;
  };

  const start = (kind: Kind, paintBeat: (progress: number) => void): Beat<Kind> => {
    stop();

    const beat: PlayingBeat<Kind> = { kind, then: null, startedAtMs: clock.now(), rafHandle: 0 };
    const step = (now: number): void => {
      const progress = (now - beat.startedAtMs) / durationMs[kind];

      paintBeat(Math.min(1, progress));

      if (progress >= 1) {
        beat.rafHandle = 0;
        playing = null;
        beat.then?.();
        return;
      }

      beat.rafHandle = clock.requestFrame(step);
    };

    playing = beat;
    paintBeat(0);
    beat.rafHandle = clock.requestFrame(step);

    return beat;
  };

  return { start, stop, current: () => playing };
};
