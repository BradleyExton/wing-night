// The five beats WN-25 has to show. The hand-off from EATING is beat one on purpose (AC#7): the
// throw is a transition out of a real phase that already exists in the state machine, not a cold
// open. `cleanup` is the miss beat (AC#6) — load-bearing, because WN-15 says the game dies if
// failure feels arbitrary, and a miss that ends in a punchline stays legible even when the physics
// is not.
export type BeatId = "eating" | "release" | "flight" | "settle" | "cleanup";

export type Beat = {
  id: BeatId;
  label: string;
  durationMs: number;
};

export const BEATS: readonly Beat[] = [
  { id: "eating", label: "EATING — timer dominant", durationMs: 2200 },
  { id: "release", label: "Eat finishes, bone released", durationMs: 700 },
  { id: "flight", label: "Flight and deflection", durationMs: 2000 },
  { id: "settle", label: "Lands in the can, or on the floor", durationMs: 1400 },
  { id: "cleanup", label: "The miss beat — she picks it up", durationMs: 2600 }
];

export const SEQUENCE_DURATION_MS = BEATS.reduce((total, beat) => total + beat.durationMs, 0);

/**
 * How long a run of the given outcome actually lasts. A landed run has no cleanup beat, so running
 * it for the full SEQUENCE_DURATION_MS would leave it sitting on a static frame with no beat
 * highlighted — the timeline and the visible beats have to agree.
 */
export const resolveSequenceDuration = (outcome: "landed" | "missed"): number => {
  return resolveVisibleBeats(outcome).reduce((total, beat) => total + beat.durationMs, 0);
};

export type SequencePosition = {
  beat: Beat;
  index: number;
  /** 0..1 through the current beat, for driving the scene's interpolation. */
  progress: number;
};

/**
 * Maps elapsed milliseconds onto a beat plus progress through it. Clamps at both ends rather than
 * wrapping: the sequence is replayed by resetting elapsed to 0, so a run that has finished should
 * hold on its final frame instead of silently restarting under a human who is studying it.
 */
export const resolveSequencePosition = (elapsedMs: number): SequencePosition => {
  if (elapsedMs <= 0) {
    return { beat: BEATS[0], index: 0, progress: 0 };
  }

  let remaining = elapsedMs;

  for (let index = 0; index < BEATS.length; index += 1) {
    const beat = BEATS[index];

    if (remaining < beat.durationMs) {
      return { beat, index, progress: remaining / beat.durationMs };
    }

    remaining -= beat.durationMs;
  }

  const lastIndex = BEATS.length - 1;

  return { beat: BEATS[lastIndex], index: lastIndex, progress: 1 };
};

/**
 * The cleanup beat only exists on a miss — a landed run ends when the bone drops into the can, so
 * the sequence is one beat shorter and should not sit on an empty stage waiting for a cleaner who
 * has no reason to walk on.
 */
export const resolveVisibleBeats = (outcome: "landed" | "missed"): readonly Beat[] => {
  if (outcome === "missed") {
    return BEATS;
  }

  return BEATS.filter((beat) => beat.id !== "cleanup");
};
