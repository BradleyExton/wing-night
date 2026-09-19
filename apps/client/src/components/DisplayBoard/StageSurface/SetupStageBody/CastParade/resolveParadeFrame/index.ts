// Where the parade is at `elapsedMs` into the night: which pair of groups is
// on the floor and what they are doing. Pure, so the choreography is a
// function of time — a hook only has to ask on a timer, and a test can ask
// about any moment without waiting for it.
//
// One cycle per pair: walk in, dance, walk out. `staged` is the first few
// frames of a cycle, when the pair is rendered off the edge before it is asked
// to walk on — the transition needs a painted start state to walk FROM, or
// the pair would simply appear at its spot.
export type ParadePhase = "staged" | "enter" | "dance" | "exit";

export type ParadeFrame = {
  pairIndex: number;
  phase: ParadePhase;
};

export const PARADE_STAGED_MS = 80;
export const PARADE_ENTER_MS = 3200;
export const PARADE_DANCE_MS = 14000;
export const PARADE_EXIT_MS = 3200;
export const PARADE_CYCLE_MS = PARADE_ENTER_MS + PARADE_DANCE_MS + PARADE_EXIT_MS;

const resolvePhase = (cycleMs: number): ParadePhase => {
  if (cycleMs < PARADE_STAGED_MS) {
    return "staged";
  }

  if (cycleMs < PARADE_ENTER_MS) {
    return "enter";
  }

  if (cycleMs < PARADE_ENTER_MS + PARADE_DANCE_MS) {
    return "dance";
  }

  return "exit";
};

export const resolveParadeFrame = (elapsedMs: number, pairCount: number): ParadeFrame => {
  if (pairCount <= 0) {
    return { pairIndex: 0, phase: "staged" };
  }

  const elapsed = Math.max(0, elapsedMs);

  return {
    pairIndex: Math.floor(elapsed / PARADE_CYCLE_MS) % pairCount,
    phase: resolvePhase(elapsed % PARADE_CYCLE_MS)
  };
};
