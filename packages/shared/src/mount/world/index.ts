import type { MountGooseStance, MountLimb, MountParticle, MountPose, MountShape, MountVec } from "../types.js";

/** The shape of `MOUNT_WORLD`, as spec §0.4 declares it. */
export type MountWorld = {
  tickHz: 60;
  floorY: 0;
  gravity: number;
  damping: number;
  maxSpeed: number;
  solverIterations: number;
  dragStep: number;
  contactFriction: number;
  braceStrength: number;
  holdStrength: number;
  gripRadius: number;
  minStaticRadius: number;
  touchRadius: number;
  inputQuantum: number;
  moveSampleTicks: number;
  fallRecoverTicks: number;
  startGap: number;
  view: { width: 240; height: 150 };
  plinth: { halfWidth: 70; height: 60; edgeRadius: 6 };
  goose: Record<MountGooseStance, { shapes: MountShape[]; top: number; topX: number }>;
  rig: {
    rest: MountPose;
    bodyJoint: MountVec;
    wingRoot: MountVec;
    wingFarRoot: MountVec;
    bone: Record<MountLimb | "wingFar", number>;
    body: { c: MountVec; r: number };
    head: { c: MountVec; r: number };
    crown: MountVec;
    radius: Record<MountLimb | "wingFar", number>;
    mass: Record<MountParticle, number>;
    limits: { from: MountParticle; to: MountParticle; min: number }[];
  };
};

// ---- the hen, copied from the cast ---------------------------------------------------------
//
// `@wingnight/shared` cannot import `@wingnight/cast` (the cast depends on shared), so these are
// copies of `packages/cast/src/Character/ragdoll` and `Character/geometry`, every one in the
// cast's 80×72 bird box, y down, at rest. `world/index.test.ts` pins each to a literal and names
// the cast constant it copies. The cast is the source of truth: when they disagree, this changes.

/** `CHARACTER_RAGDOLL_SEGMENTS.*.joint` and `.tip`, and the rig's tail root as the rump. */
const REST: MountPose = {
  rump: { x: 20, y: 42 }, // CHARACTER_PIVOTS.tail
  neck: { x: 52, y: 36 }, // CHARACTER_PIVOTS.head, the head segment's joint
  hipLeft: { x: 32, y: 57 }, // CHARACTER_PIVOTS.legNear
  hipRight: { x: 44, y: 57 }, // CHARACTER_PIVOTS.legFar
  footLeft: { x: 32, y: 71 }, // legNear's tip: the hip plus TOE_DROP 14
  footRight: { x: 44, y: 71 }, // legFar's tip
  wing: { x: 24, y: 55 }, // wingNear's tip: WING_TIP
  beak: { x: 81, y: 20 }, // head's tip: DRAWN_BEAK_TIP
  wingFar: { x: 28, y: 53 } // wingFar's tip: WING_TIP plus FAR_WING_OFFSET (4, −2)
};

/** `CHARACTER_RAGDOLL_BODY.joint`, `CHARACTER_PIVOTS.wing`, and that plus `FAR_WING_OFFSET`. */
const BODY_JOINT: MountVec = { x: 40, y: 45 };
const WING_ROOT: MountVec = { x: 47, y: 35 };
const WING_FAR_ROOT: MountVec = { x: 51, y: 33 };

const distance = (a: MountVec, b: MountVec): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(dx * dx + dy * dy);
};

/** `CHARACTER_RAGDOLL_SEGMENTS.*.length`: legs 14, wings √929 ≈ 30.48, head √1097 ≈ 33.12. */
const BONE: Record<MountLimb | "wingFar", number> = {
  footLeft: distance(REST.hipLeft, REST.footLeft),
  footRight: distance(REST.hipRight, REST.footRight),
  wing: distance(WING_ROOT, REST.wing),
  beak: distance(REST.neck, REST.beak),
  wingFar: distance(WING_FAR_ROOT, REST.wingFar)
};

// ---- the plinth and the goose ---------------------------------------------------------------

const PLINTH = { halfWidth: 70, height: 60, edgeRadius: 6 } as const;
/** Where the goose stands: the plinth's top surface, its top capsule's centreline plus its radius. */
const PLINTH_SURFACE_Y = -(PLINTH.height + PLINTH.edgeRadius);
/** The goose's body ball: sitting on the plinth's surface, a hair left of centre so its neck is over the middle. */
const GOOSE_BODY_RADIUS = 25;
const GOOSE_BODY: MountVec = { x: 0, y: PLINTH_SURFACE_Y - GOOSE_BODY_RADIUS };
const GOOSE_HEAD_RADIUS = 10;
const GOOSE_NECK_RADIUS = 6;
/** No static shape is thinner than `minStaticRadius`, the goose's bill included. */
const GOOSE_BILL_RADIUS = 4;

const goose = { kind: "goose" } as const;

const circle = (c: MountVec, r: number): MountShape => ({ kind: "circle", c, r, surface: goose });
const capsule = (a: MountVec, b: MountVec, r: number): MountShape => ({ kind: "capsule", a, b, r, surface: goose });

/**
 * A Canada goose on the plinth in three stances. Each is a body ball sitting on the plinth, a neck
 * capsule, a head ball and a bill, and `top` is the head ball's top: the line every round starts
 * under. `stand` is the goose at full height (160), `honk` the neck thrown forward (145), `preen`
 * the head turned back into its own shoulder (125). `topX` is the head's centre, where the line's
 * holder hangs while the goose holds it.
 */
const GOOSE: Record<MountGooseStance, { shapes: MountShape[]; top: number; topX: number }> = {
  stand: {
    shapes: [
      circle(GOOSE_BODY, GOOSE_BODY_RADIUS),
      capsule({ x: 14, y: -108 }, { x: 22, y: -142 }, GOOSE_NECK_RADIUS),
      circle({ x: 26, y: -150 }, GOOSE_HEAD_RADIUS),
      capsule({ x: 34, y: -150 }, { x: 46, y: -148 }, GOOSE_BILL_RADIUS)
    ],
    top: 160,
    topX: 26
  },
  honk: {
    shapes: [
      circle(GOOSE_BODY, GOOSE_BODY_RADIUS),
      capsule({ x: 16, y: -106 }, { x: 34, y: -128 }, GOOSE_NECK_RADIUS),
      circle({ x: 40, y: -135 }, GOOSE_HEAD_RADIUS),
      capsule({ x: 48, y: -135 }, { x: 60, y: -137 }, GOOSE_BILL_RADIUS)
    ],
    top: 145,
    topX: 40
  },
  preen: {
    shapes: [
      circle(GOOSE_BODY, GOOSE_BODY_RADIUS),
      capsule({ x: 10, y: -108 }, { x: -4, y: -112 }, GOOSE_NECK_RADIUS),
      circle({ x: -12, y: -115 }, GOOSE_HEAD_RADIUS),
      capsule({ x: -18, y: -110 }, { x: -24, y: -102 }, GOOSE_BILL_RADIUS)
    ],
    top: 125,
    topX: -12
  }
};

/**
 * The fixed geometry and tuning every climb shares. The world is the cast's bird box at scale 1:
 * one unit is one unit of the 80×72 box, y runs down, and the floor is y 0, so a height above the
 * floor is −y. Speeds are per tick at `tickHz`, so a tick count is a duration on every machine.
 *
 * Checked against the goose bot (`gooseBot/`, refereed by `simulate/index.test.ts`): seven
 * drags hook the beak on the plinth, haul the hen over its edge and get its crown over the
 * standing goose in under eight seconds, while a hen nobody touches stands where it started and
 * banks nothing. The spec's first-cut numbers stand; whether flinging beats climbing is still a
 * table question (spec §0.10, "Fling tuning").
 */
export const MOUNT_WORLD: MountWorld = {
  tickHz: 60,
  floorY: 0,
  /** Units a tick a tick on every free particle: floatier than a real hen, on purpose. */
  gravity: 0.25,
  /** The share of last tick's velocity a particle keeps, so a swing dies down. */
  damping: 0.99,
  /** No particle's own motion carries it further than this in a tick, so nothing tunnels. */
  maxSpeed: 5,
  /** Passes over the constraints each tick, always in the same order. */
  solverIterations: 8,
  /** How fast a held limb chases the finger, and the ceiling on a push-off: the fling's lever. */
  dragStep: 4,
  /** The share of sliding a contact takes out each tick. */
  contactFriction: 0.6,
  /** The most a grabbed limb's brace corrects a tick. One brace sags under the bird; two stand it. */
  braceStrength: 0.5,
  /**
   * Not in the spec's first cut: the most a limp or seeking limb's hold corrects a tick. A limb
   * nobody touches keeps its angle against the body up to this, so the head does not flop over
   * backwards whenever the torso tips, and a limb let go in the air stays where it was aimed.
   */
  holdStrength: 2,
  /** A limb tip's own ball, for touching a surface and for sticking to it. */
  gripRadius: 3,
  /** No static shape is thinner than this, so a stuck hen's leg is a foothold a hair wider than drawn. */
  minStaticRadius: 4,
  /** How near a touch must land to a limb's tip to take that limb (the client's rule). */
  touchRadius: 14,
  /** Every sample's x and y is a multiple of this, so a log is small and exact. */
  inputQuantum: 0.125,
  /** At most one `move` per limb every this many ticks; between samples the target holds. */
  moveSampleTicks: 2,
  /** The set-upright beat after a fall, 0.75 s. The clock keeps running through it. */
  fallRecoverTicks: 45,
  /** How far left of the pile's leftmost shape the start stance's front foot stands. */
  startGap: 40,
  view: { width: 240, height: 150 },
  plinth: PLINTH,
  goose: GOOSE,
  rig: {
    rest: REST,
    bodyJoint: BODY_JOINT,
    wingRoot: WING_ROOT,
    wingFarRoot: WING_FAR_ROOT,
    bone: BONE,
    /** `CHARACTER_RAGDOLL_BODY.centre` and `.radius` (`CHARACTER_BODY`). */
    body: { c: { x: 41.5, y: 44 }, r: 23 },
    /** `CHARACTER_HEAD_CENTRE` and `CHARACTER_HEAD_RADIUS`: the costume head, 44 tall. */
    head: { c: { x: 58, y: 10 }, r: 22 },
    /** `COSTUME_HEAD_ANCHORS.cx` and `.top`: the top of the costume head. */
    crown: { x: 58, y: -12 },
    /** Half of each segment's `thickness`: the leg stroke 3.5, the wing 24, the drawn head 24. */
    radius: { footLeft: 1.75, footRight: 1.75, wing: 12, beak: 12, wingFar: 12 },
    /** The torso is heavy and the limbs light, so a limb swings without dragging the bird. */
    mass: {
      rump: 4,
      neck: 4,
      hipLeft: 4,
      hipRight: 4,
      footLeft: 1,
      footRight: 1,
      wing: 1,
      beak: 2,
      wingFar: 1
    },
    /**
     * Joint limits, as distances, never angles. The beak never folds back over the rump, and it
     * never hangs down past the near hip, so a limp head stays up and forward of the chest
     * rather than dropping the head ball onto the floor (which would be a fall).
     */
    limits: [
      { from: "beak", to: "rump", min: 50 },
      { from: "beak", to: "hipLeft", min: 50 }
    ]
  }
};

/** The particles in the one order every loop in the module walks them. */
export const MOUNT_PARTICLES: readonly MountParticle[] = [
  "rump",
  "neck",
  "hipLeft",
  "hipRight",
  "footLeft",
  "footRight",
  "wing",
  "beak",
  "wingFar"
];

/** The limbs in the one order every loop in the module walks them. */
export const MOUNT_LIMBS: readonly MountLimb[] = ["footLeft", "footRight", "wing", "beak"];
