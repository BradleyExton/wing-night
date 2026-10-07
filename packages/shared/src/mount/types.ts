// The contract, copied verbatim from docs/minigames/mount-your-hens-spec.md §0.4. It does not
// change without changing that section.

/** The four limbs a climber moves. Left and right are the box's, the hen facing right at rest:
 *  footLeft is the cast's legNear, footRight its legFar, wing its wingNear, beak its head. */
export type MountLimb = "footLeft" | "footRight" | "wing" | "beak";

/** A point in world units (the bird box at scale 1, y down, the floor at y 0). */
export type MountVec = { x: number; y: number };

/**
 * The climber's particles. The torso is four held rigid (rump, neck, both hips); each limb is
 * one particle at the tip of its bone; the far wing is a tip nobody controls, which only dangles.
 */
export type MountParticle =
  | "rump"
  | "neck"
  | "hipLeft"
  | "hipRight"
  | "footLeft"
  | "footRight"
  | "wing"
  | "beak"
  | "wingFar";

/** Where every particle is. A hen frozen on the pile is one of these and nothing more. */
export type MountPose = Record<MountParticle, MountVec>;

/**
 * One pointer sample as the tablet logged it. `grab-start` is a finger landing on a limb (it
 * lets go of whatever that limb held), `move` is the finger moving, `release` is the finger
 * lifting. `x` and `y` are where the finger is, in world units through the tablet's camera,
 * each a multiple of `MOUNT_WORLD.inputQuantum`. Ticks are non-decreasing through a climb's log;
 * several samples may share a tick (two fingers), applied in log order.
 */
export type MountInputSample = {
  tick: number;
  limb: MountLimb;
  kind: "grab-start" | "move" | "release";
  x: number;
  y: number;
};

/** What a surface a limb can grab is. `hen` names a stuck hen by its place in the pile. */
export type MountSurfaceRef =
  | { kind: "floor" }
  | { kind: "plinth" }
  | { kind: "goose" }
  | { kind: "hen"; pileIndex: number };

/** A static collision shape: a ball, or a capsule (a segment with a radius). */
export type MountShape =
  | { kind: "circle"; c: MountVec; r: number; surface: MountSurfaceRef }
  | { kind: "capsule"; a: MountVec; b: MountVec; r: number; surface: MountSurfaceRef };

/**
 * What a limb is doing. `limp`: free and not sticky (the wing and beak at the start).
 * `held`: a finger is on it; it chases `target` and is not sticky. `seeking`: let go away from
 * any surface; it grabs the first one it touches. `grabbed`: pinned at `at` until next touched.
 */
export type MountLimbState =
  | { kind: "limp" }
  | { kind: "held"; target: MountVec }
  | { kind: "seeking" }
  | { kind: "grabbed"; at: MountVec; surface: MountSurfaceRef; brace: number };

/** The goose's stance, dealt by the pile's seed. Every team in a round climbs the same goose. */
export type MountGooseStance = "stand" | "honk" | "preen";

/** The line to beat. `playerId` is null while the goose holds it. */
export type MountHighLine = {
  /** Height above the floor, world units. */
  height: number;
  /** Where the crown that set it was, so a surface can hang the holder's head on the line. */
  x: number;
  playerId: string | null;
};

/** A hen on the pile: frozen where its climb ended, a static hold for everyone after it. */
export type MountPileHen = {
  /** Its place in the round's pile, from 0, in the order the hens joined. */
  pileIndex: number;
  playerId: string | null;
  pose: MountPose;
  /** The limbs that were holding on when the climb ended, and where. For drawing the grip. */
  grabs: Partial<Record<MountLimb, MountVec>>;
  /** True when this climb took the line. */
  mounted: boolean;
};

/** The round's mountain. The whole of the plugin's round memory. */
export type MountPile = {
  seed: number;
  goose: MountGooseStance;
  hens: MountPileHen[];
  highLine: MountHighLine;
};

/** The two published clock rules, in seconds, as `minigameRules.mount` carries them. */
export type MountClimbRules = { climbSeconds: number; secondsPerHen: number };

/** How a climb ended. `mounted` is the crown over the line; `timeout` is the climb's clock. */
export type MountOutcome = "mounted" | "timeout";

/** A tick and a limb, for the events a surface flinches or sounds at. */
export type MountLimbEvent = { tick: number; limb: MountLimb };

/** Everything the sim knows at one tick. `outcome` is set on the terminal state, never cleared. */
export type MountState = {
  /** The round's pile seed, carried so a re-run names its stream (see "Seeded" below). */
  seed: number;
  playerId: string | null;
  tick: number;
  /** This climb's clock, fixed at creation by the published rule. */
  climbTicks: number;
  /** What this climb is climbing. It never changes during a climb. */
  pile: MountPile;
  /** The pile as shapes, built once at creation. The floor is the line y = 0, not a shape. */
  mesh: MountShape[];
  /** The start stance beside the pile: where the climb begins and where a fall puts the hen. */
  start: MountPose;
  pose: MountPose;
  /** Verlet's last positions: a particle's velocity is `pose − previous`. */
  previous: MountPose;
  limbs: Record<MountLimb, MountLimbState>;
  /** After a fall, samples are ignored and the hen blinks until here. */
  recoveringUntilTick: number;
  /** The crown's height in the start stance: a near miss is measured from here. */
  startHeight: number;
  /** The highest the crown has been this climb, falls included. */
  bestHeight: number;
  /** Every grab (a seeking limb sticking), every let-go (a grabbed limb touched loose), every fall. */
  grabs: MountLimbEvent[];
  letGoes: MountLimbEvent[];
  falls: number[];
  outcome: MountOutcome | null;
};

/** What a finished climb is worth and what it leaves behind. */
export type MountClimbResult = {
  outcome: MountOutcome;
  endTick: number;
  /** 1 on a mount; otherwise (best − start) / (line − start), clamped to [0, 1). */
  share: number;
  bestHeight: number;
  falls: number;
  /** The hen as it joins the pile: its pose on the terminal tick, frozen. */
  hen: MountPileHen;
};

