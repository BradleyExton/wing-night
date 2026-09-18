/**
 * FAPPY's physics vocabulary: the gates a leg flies through, the bird's pose, and the frame the
 * tick-stepped sim produces. Free of any minigame, transport or rendering concern — the tablet
 * plays it live, the server referees a leg from its flap log, and the display mirrors the same
 * log, so a frame is a pure function of course + flaps + tick on all three.
 */

/**
 * One obstacle: a champ standing up from the floor, bobbing, and sometimes an eagle hanging in
 * the sky above it. The gap is whatever is left between the two.
 */
export type FappyGate = {
  /** Global gate number across the turn, so the room can count "gate 12 of 32". */
  index: number;
  /** Left edge in world units, measured from the leg's scroll origin. */
  x: number;
  /** Where the top of the champ's head sits at the bottom of its bob (its lowest reach). */
  champTop: number;
  /** How far the head rises above `champTop` at the top of its bob. 0 stands still. */
  champBob: number;
  /** One full bob, up and back down, in ticks. */
  champPeriodTicks: number;
  /** Where in its bob the champ is at tick 0, so a course is not all in step. */
  champPhaseTicks: number;
  /** Underside of the eagle over this gate, or null when the sky is clear to the ceiling. */
  eagleBottom: number | null;
};

export type FappyBird = {
  y: number;
  vy: number;
};

export type FappyOutcome = "cleared" | "crashed";

/**
 * An eagle the bird has bumped out of the sky: which gate's, and the tick it went (`-1` when it
 * was already gone before this attempt started, so a renderer hides it rather than plays the
 * knock).
 */
export type FappyKnockedEagle = {
  gate: number;
  tick: number;
};

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type FappyFrame = {
  tick: number;
  bird: FappyBird;
  scrollX: number;
  gatesCleared: number;
  knockedEagles: FappyKnockedEagle[];
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
