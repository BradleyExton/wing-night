/**
 * SCHLONIC's physics vocabulary: the zone a run is laid out over, the runner's state, and the
 * frame the tick-stepped sim produces. Free of any minigame, transport or rendering concern —
 * the tablet plays it live, the server referees a run from its input log, and the display mirrors
 * the same log, so a frame is a pure function of zone + inputs + tick on all three.
 */

/** A gap in the ground, in world x. Falling into one ends the run whatever you were holding. */
export type SchlonicPit = {
  fromX: number;
  toX: number;
  /** The ground either side of the hole. Dropping below it over the hole is the fall. */
  lipY: number;
};

/**
 * Everything that is not ground: a wing to collect, a thorn bed that always hurts, a badnik that
 * only hurts you on your feet (land on it and it pops instead), a springboard that throws you
 * at the high wing line, and a grind rail — a one-way ledge that catches a falling runner and
 * carries it, with the greedy line strung along its top. The runner is the player's own cast hen
 * and the three HAZARDS are all the cast's schlong, which is the whole visual joke; the wing is
 * deliberately neither, because a collectible that shared a silhouette with the things that hurt
 * you would be unreadable at the speed this runs at. The rail is kit, not a hazard: its side does
 * nothing to you, and the only way to meet it is to come down on it.
 */
export type SchlonicPropKind = "wing" | "spike" | "badnik" | "spring" | "rail";

export type SchlonicProp = {
  /** Index within the zone's own `props`, so a frame can name the ones it has taken. */
  index: number;
  kind: SchlonicPropKind;
  /** The middle of anything but a rail, which starts here. */
  x: number;
  /** Centre for a wing; a rail's top, where the feet go; the ground it stands on for everything else. */
  y: number;
  /**
   * Where a rail ends: it spans `x` to here, level, at `y`. Nothing but a rail carries it.
   */
  toX?: number;
  /**
   * What a wing is worth in hand: one on the floor, two on the high line — the line only speed,
   * a held jump or a springboard reaches. Absent means one; nothing but a wing carries it. It is
   * why greed pays: the floor alone cannot make par.
   */
  worth?: number;
};

/**
 * One zone. The ground is a heightfield sampled every `SCHLONIC_WORLD.sampleStep` units and
 * straight between samples, holed by `pits`; everything else stands on it. Derived from a seed,
 * so the same three numbers lay out the same zone on every machine.
 */
export type SchlonicZone = {
  heights: number[];
  pits: SchlonicPit[];
  props: SchlonicProp[];
  /** Crossing this x ends the run cleared. */
  goalX: number;
};

/**
 * What picks a zone: every team in the round runs the same one, so the night is a fair race.
 * The street is one course of `legs` legs, `chunks` chunks each, laid out end to end from the
 * one seed; a run is one leg of it, and `leg` says which. A leg is a zone in its own right —
 * its own run-up, its own finale, its own post — rebased so its start line is x 0, which is
 * what lets the sim, the referee and the mirror stay leg-blind. `legs` and `leg` default to
 * one and nought: a course of one leg is the zone as it always was.
 */
export type SchlonicZoneCourse = {
  seed: number;
  chunks: number;
  legs?: number;
  leg?: number;
};

/** How a run ended. `wiped` is a hit taken with nothing in hand; `fell` is a pit. */
export type SchlonicOutcome = "cleared" | "wiped" | "fell";

/** One tick of input as the tablet logged it: the button going down, or coming back up. */
export type SchlonicInput = {
  tick: number;
  down: boolean;
};

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type SchlonicFrame = {
  tick: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  /** The button is still down: a held jump climbs higher, the way a platformer should. */
  holding: boolean;
  /** Wings in hand — the score, and the whole health bar. */
  wings: number;
  /** Props already taken, by index: wings collected and badniks smashed. */
  takenProps: number[];
  /** The tick of every hit this run, so a surface can burst wings at the right moment. */
  hits: number[];
  /**
   * The rail being ground, by its index in the zone's `props`; null anywhere else. Set on every
   * frame the feet are on one — `grounded` is true there too, since a press jumps off a rail the
   * way it jumps off the floor — so a surface can draw the grind without guessing it from `y`.
   */
  grindingRail: number | null;
  /** Hits pass through up to this tick, so one spike strip cannot cost two handfuls. */
  invulnerableUntilTick: number;
  outcome: SchlonicOutcome | null;
};

export type SchlonicRun = {
  /** `running` only when the tick cap was reached first, which the cap is sized to make impossible. */
  outcome: SchlonicOutcome | "running";
  endTick: number;
  /** Wings in hand when it ended — nothing if the run ended badly. */
  wings: number;
  /** How far along the zone the run got, in world units. */
  distance: number;
  frame: SchlonicFrame;
};
