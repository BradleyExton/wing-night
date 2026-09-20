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
 * Everything that is not ground: a ring to collect, a thorn bed that always hurts, a badnik that
 * only hurts you on your feet (land on it and it pops instead), and a springboard that throws you
 * at the high ring line. The runner is the player's own cast hen; the zone is furnished with the
 * cast's schlong, which is the whole visual joke.
 */
export type SchlonicPropKind = "ring" | "spike" | "badnik" | "spring";

export type SchlonicProp = {
  /** Index within the zone's own `props`, so a frame can name the ones it has taken. */
  index: number;
  kind: SchlonicPropKind;
  x: number;
  /** Centre for a ring; the ground it stands on for everything else. */
  y: number;
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

/** What picks a zone: every team in the round runs the same one, so the night is a fair race. */
export type SchlonicZoneCourse = {
  seed: number;
  chunks: number;
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
  /** Rings in hand — the score, and the whole health bar. */
  rings: number;
  /** Props already taken, by index: rings collected and badniks smashed. */
  takenProps: number[];
  /** The tick of every hit this run, so a surface can burst rings at the right moment. */
  hits: number[];
  /** Hits pass through up to this tick, so one spike strip cannot cost two handfuls. */
  invulnerableUntilTick: number;
  outcome: SchlonicOutcome | null;
};

export type SchlonicRun = {
  /** `running` only when the tick cap was reached first, which the cap is sized to make impossible. */
  outcome: SchlonicOutcome | "running";
  endTick: number;
  /** Rings in hand when it ended — nothing if the run ended badly. */
  rings: number;
  /** How far along the zone the run got, in world units. */
  distance: number;
  frame: SchlonicFrame;
};
