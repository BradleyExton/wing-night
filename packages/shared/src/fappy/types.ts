/**
 * FAPPY's physics vocabulary: the gates a leg flies through, the bird's pose, and the frame the
 * tick-stepped sim produces. Free of any minigame, transport or rendering concern — the tablet
 * plays it live, the server referees a leg from its flap log, and the display mirrors the same
 * log, so a frame is a pure function of course + flaps + tick on all three.
 */

/** One obstacle pair: a champ standing up from the floor and one hanging from the ceiling. */
export type FappyGate = {
  /** Global gate number across the turn, so the room can count "gate 12 of 32". */
  index: number;
  /** Left edge in world units, measured from the leg's scroll origin. */
  x: number;
  gapTop: number;
  gapBottom: number;
};

export type FappyBird = {
  y: number;
  vy: number;
};

export type FappyOutcome = "cleared" | "crashed";

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type FappyFrame = {
  tick: number;
  bird: FappyBird;
  scrollX: number;
  gatesCleared: number;
  outcome: FappyOutcome | null;
};

/** What picks a leg's course: the same three numbers derive the same gates on every machine. */
export type FappyLegCourse = {
  seed: number;
  legIndex: number;
  gatesPerLeg: number;
};

export type FappyLegRun = {
  /** `flying` only when the tick cap was reached first, which the cap is sized to make impossible. */
  outcome: FappyOutcome | "flying";
  endTick: number;
  gatesCleared: number;
  frame: FappyFrame;
};
