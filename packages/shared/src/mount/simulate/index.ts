import type {
  MountClimbResult,
  MountClimbRules,
  MountInputSample,
  MountLimb,
  MountLimbState,
  MountPile,
  MountPose,
  MountShape,
  MountState,
  MountSurfaceRef,
  MountVec
} from "../types.js";
import {
  BODY_CENTRE_WEIGHTS,
  BODY_JOINT_WEIGHTS,
  HEAD_WEIGHTS,
  LIMB_JOINT_WEIGHTS,
  PARTICLE_COUNT,
  PARTICLE_INDEX,
  WING_CAPSULE_SHARE,
  placeCrown,
  placeHeadCentre,
  placeWeighted,
  toPoints,
  toPose,
  type MountWeights,
  type Points
} from "../rig/index.js";
import {
  resolveMountClimbTicks,
  resolveMountPileBounds,
  resolveMountPileMesh,
  resolveMountShapeBox
} from "../pile/index.js";
import { MOUNT_LIMBS, MOUNT_PARTICLES, MOUNT_WORLD } from "../world/index.js";

const { rig } = MOUNT_WORLD;

/**
 * How near counts as touching: a tip's grip ball within this of a surface, after the contacts
 * have pushed it out to exactly resting on it. Without it a ball resting on a hold would flicker
 * between touching and not on rounding alone.
 */
const TOUCH_SLOP = 0.25;
/** The same allowance for the fall test: the body or head ball resting on the floor. */
const FALL_SLOP = 0.25;
/**
 * A timed-out share is below 1 whatever the arithmetic says: a crown level with the line but not
 * over it is a near miss, never a mount.
 */
const TIMEOUT_SHARE_CEILING = 0.99;
/** Grown onto the climber's box before the broad phase: the furthest any collider sits from a particle. */
const BROAD_PHASE_REACH = rig.head.r + rig.bone.beak + MOUNT_WORLD.maxSpeed + MOUNT_WORLD.dragStep;

const LEG_LIMBS = ["footLeft", "footRight"] as const;

/** Each limb's tip particle. */
const TIP_INDEX: Record<MountLimb, number> = {
  footLeft: PARTICLE_INDEX.footLeft,
  footRight: PARTICLE_INDEX.footRight,
  wing: PARTICLE_INDEX.wing,
  beak: PARTICLE_INDEX.beak
};

const TORSO_INDICES = [PARTICLE_INDEX.rump, PARTICLE_INDEX.neck, PARTICLE_INDEX.hipLeft, PARTICLE_INDEX.hipRight];

// ---- the climb's start ----------------------------------------------------------------------

const distanceBetween = (a: MountVec, b: MountVec): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(dx * dx + dy * dy);
};

/** The torso's six rest distances, in the one order the solver walks them. */
const TORSO_PAIRS: readonly (readonly [number, number, number])[] = (() => {
  const pairs: [number, number, number][] = [];

  for (let first = 0; first < TORSO_INDICES.length; first += 1) {
    for (let second = first + 1; second < TORSO_INDICES.length; second += 1) {
      const a = MOUNT_PARTICLES[TORSO_INDICES[first] ?? 0] ?? "rump";
      const b = MOUNT_PARTICLES[TORSO_INDICES[second] ?? 0] ?? "rump";
      pairs.push([TORSO_INDICES[first] ?? 0, TORSO_INDICES[second] ?? 0, distanceBetween(rig.rest[a], rig.rest[b])]);
    }
  }

  return pairs;
})();

const translatePose = (pose: MountPose, dx: number, dy: number): MountPose => {
  const moved = { ...pose };

  for (const particle of MOUNT_PARTICLES) {
    moved[particle] = { x: pose[particle].x + dx, y: pose[particle].y + dy };
  }

  return moved;
};

/** The start stance: `still`, toes on the floor, the front foot `startGap` left of the pile. */
const resolveStartPose = (pile: MountPile): MountPose => {
  const { minX } = resolveMountPileBounds(pile);
  const frontFootX = minX - MOUNT_WORLD.startGap;

  return translatePose(rig.rest, frontFootX - rig.rest.footRight.x, MOUNT_WORLD.floorY - rig.rest.footRight.y);
};

const bodyJointOf = (pose: MountPose): MountVec => placeWeighted(toPoints(pose), BODY_JOINT_WEIGHTS);

const grabbedAt = (pose: MountPose, limb: MountLimb, surface: MountSurfaceRef): MountLimbState => {
  const at = pose[limb];

  return { kind: "grabbed", at, surface, brace: distanceBetween(at, bodyJointOf(pose)) };
};

/** Both feet grabbed on the floor where they stand, the wing and the beak limp. */
const resolveStartLimbs = (start: MountPose): Record<MountLimb, MountLimbState> => ({
  footLeft: grabbedAt(start, "footLeft", { kind: "floor" }),
  footRight: grabbedAt(start, "footRight", { kind: "floor" }),
  wing: { kind: "limp" },
  beak: { kind: "limp" }
});

const heightOf = (point: MountVec): number => MOUNT_WORLD.floorY - point.y;

/** A climb at tick 0: the hen in the start stance beside `pile`, both feet grabbed on the floor,
 *  the wing and beak limp, the clock resolved from `rules` and the hens on `pile`. */
export const createMountState = (
  seed: number,
  pile: MountPile,
  rules: MountClimbRules,
  playerId: string | null
): MountState => {
  const start = resolveStartPose(pile);
  const startHeight = heightOf(placeCrown(start.neck, start.beak));

  return {
    seed,
    playerId,
    tick: 0,
    climbTicks: resolveMountClimbTicks(rules, pile.hens.length),
    pile,
    mesh: resolveMountPileMesh(pile),
    start,
    pose: start,
    previous: start,
    limbs: resolveStartLimbs(start),
    recoveringUntilTick: 0,
    startHeight,
    bestHeight: startHeight,
    grabs: [],
    letGoes: [],
    falls: [],
    outcome: null
  };
};

// ---- samples --------------------------------------------------------------------------------

type Events = { grabs: MountState["grabs"]; letGoes: MountState["letGoes"] };

/** The samples logged at exactly this tick, in log order. */
const applySamples = (
  state: MountState,
  samples: readonly MountInputSample[],
  events: Events
): Record<MountLimb, MountLimbState> => {
  const limbs = { ...state.limbs };

  if (state.tick < state.recoveringUntilTick) {
    return limbs;
  }

  for (const sample of samples) {
    if (sample.tick !== state.tick) {
      continue;
    }

    const current = limbs[sample.limb];

    if (sample.kind === "grab-start") {
      if (current.kind === "grabbed") {
        events.letGoes.push({ tick: state.tick, limb: sample.limb });
      }

      limbs[sample.limb] = { kind: "held", target: { x: sample.x, y: sample.y } };
      continue;
    }

    if (current.kind !== "held") {
      continue;
    }

    limbs[sample.limb] =
      sample.kind === "move" ? { kind: "held", target: { x: sample.x, y: sample.y } } : { kind: "seeking" };
  }

  return limbs;
};

// ---- contacts -------------------------------------------------------------------------------

/** The shapes whose boxes overlap the climber's box grown by its reach: the holds within reach. */
const resolveNearShapes = (mesh: readonly MountShape[], points: Points): MountShape[] => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    minX = Math.min(minX, points.x[index] ?? 0);
    maxX = Math.max(maxX, points.x[index] ?? 0);
    minY = Math.min(minY, points.y[index] ?? 0);
    maxY = Math.max(maxY, points.y[index] ?? 0);
  }

  minX -= BROAD_PHASE_REACH;
  maxX += BROAD_PHASE_REACH;
  minY -= BROAD_PHASE_REACH;
  maxY += BROAD_PHASE_REACH;

  return mesh.filter((shape) => {
    const box = resolveMountShapeBox(shape);

    return box.maxX >= minX && box.minX <= maxX && box.maxY >= minY && box.minY <= maxY;
  });
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** The parameter of the point on segment a→b nearest to p. */
const nearestOnSegment = (ax: number, ay: number, bx: number, by: number, px: number, py: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  return lengthSquared > 0 ? clamp01(((px - ax) * dx + (py - ay) * dy) / lengthSquared) : 0;
};

/** The nearest pair of points between segments p1→q1 and p2→q2, as their parameters (Ericson §5.1.9). */
const nearestBetweenSegments = (
  p1: MountVec,
  q1: MountVec,
  p2: MountVec,
  q2: MountVec
): { s: number; t: number } => {
  const d1x = q1.x - p1.x;
  const d1y = q1.y - p1.y;
  const d2x = q2.x - p2.x;
  const d2y = q2.y - p2.y;
  const rx = p1.x - p2.x;
  const ry = p1.y - p2.y;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;

  if (a <= 0 && e <= 0) {
    return { s: 0, t: 0 };
  }

  if (a <= 0) {
    return { s: 0, t: clamp01(f / e) };
  }

  const c = d1x * rx + d1y * ry;

  if (e <= 0) {
    return { s: clamp01(-c / a), t: 0 };
  }

  const b = d1x * d2x + d1y * d2y;
  const denominator = a * e - b * b;
  let s = denominator > 0 ? clamp01((b * f - c * e) / denominator) : 0;
  let t = (b * s + f) / e;

  if (t < 0) {
    t = 0;
    s = clamp01(-c / a);
  } else if (t > 1) {
    t = 1;
    s = clamp01((b - c) / a);
  }

  return { s, t };
};

/** The point on a static shape nearest to `point`, and the shape's radius. */
const nearestOnShape = (shape: MountShape, point: MountVec): MountVec => {
  if (shape.kind === "circle") {
    return shape.c;
  }

  const s = nearestOnSegment(shape.a.x, shape.a.y, shape.b.x, shape.b.y, point.x, point.y);

  return { x: shape.a.x + (shape.b.x - shape.a.x) * s, y: shape.a.y + (shape.b.y - shape.a.y) * s };
};

type Touch = { surface: MountSurfaceRef; normal: MountVec };

/** The surface a ball touches and the way out of it, floor first and then the near shapes in mesh order, or null. */
const resolveTouch = (point: MountVec, radius: number, near: readonly MountShape[]): Touch | null => {
  if (point.y + radius >= MOUNT_WORLD.floorY - TOUCH_SLOP) {
    return { surface: { kind: "floor" }, normal: { x: 0, y: -1 } };
  }

  for (const shape of near) {
    const nearest = nearestOnShape(shape, point);
    const length = distanceBetween(point, nearest);

    if (length - shape.r - radius <= TOUCH_SLOP) {
      return {
        surface: shape.surface,
        normal: length > 0 ? { x: (point.x - nearest.x) / length, y: (point.y - nearest.y) / length } : { x: 0, y: -1 }
      };
    }
  }

  return null;
};

// ---- the solver -----------------------------------------------------------------------------

type Solver = {
  points: Points;
  previous: Points;
  inverseMass: Float64Array;
  /** The last contact normal each particle took this tick, for friction; (0, 0) is none. */
  normalX: Float64Array;
  normalY: Float64Array;
};

/** Moves a carried point by `amount` along (nx, ny), shared by its particles' inverse masses. */
const pushWeighted = (
  solver: Solver,
  weights: MountWeights,
  nx: number,
  ny: number,
  amount: number,
  cap: number,
  isContact: boolean
): void => {
  let denominator = 0;

  for (const [index, weight] of weights) {
    denominator += weight * weight * (solver.inverseMass[index] ?? 0);
  }

  if (denominator <= 0) {
    return;
  }

  const lambda = amount / denominator;

  for (const [index, weight] of weights) {
    const inverseMass = solver.inverseMass[index] ?? 0;

    if (inverseMass <= 0 || weight === 0) {
      continue;
    }

    const step = Math.max(-cap, Math.min(cap, weight * inverseMass * lambda));
    solver.points.x[index] = (solver.points.x[index] ?? 0) + nx * step;
    solver.points.y[index] = (solver.points.y[index] ?? 0) + ny * step;

    if (isContact) {
      solver.normalX[index] = nx;
      solver.normalY[index] = ny;
    }
  }
};

type Distance = { from: MountWeights; to: MountWeights; length: number; mode: "equal" | "atLeast"; cap: number };

/** Holds two carried points `length` apart (or at least that far), the correction shared by mass. */
const solveDistance = (solver: Solver, constraint: Distance): void => {
  const a = placeWeighted(solver.points, constraint.from);
  const b = placeWeighted(solver.points, constraint.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length <= 0) {
    return;
  }

  const error = length - constraint.length;

  if (constraint.mode === "atLeast" && error >= 0) {
    return;
  }

  const correction = Math.max(-constraint.cap, Math.min(constraint.cap, error));
  const nx = dx / length;
  const ny = dy / length;
  const { from, to } = constraint;
  const { inverseMass, points } = solver;
  let denominator = 0;

  for (let at = 0; at < from.length; at += 1) {
    const [index, weight] = from[at] ?? EMPTY_PAIR;
    denominator += weight * weight * (inverseMass[index] ?? 0);
  }

  for (let at = 0; at < to.length; at += 1) {
    const [index, weight] = to[at] ?? EMPTY_PAIR;
    denominator += weight * weight * (inverseMass[index] ?? 0);
  }

  if (denominator <= 0) {
    return;
  }

  const lambda = correction / denominator;

  for (let at = 0; at < from.length; at += 1) {
    const [index, weight] = from[at] ?? EMPTY_PAIR;
    const step = weight * (inverseMass[index] ?? 0) * lambda;
    points.x[index] = (points.x[index] ?? 0) + nx * step;
    points.y[index] = (points.y[index] ?? 0) + ny * step;
  }

  for (let at = 0; at < to.length; at += 1) {
    const [index, weight] = to[at] ?? EMPTY_PAIR;
    const step = weight * (inverseMass[index] ?? 0) * lambda;
    points.x[index] = (points.x[index] ?? 0) - nx * step;
    points.y[index] = (points.y[index] ?? 0) - ny * step;
  }
};

const EMPTY_PAIR = [0, 0] as const;

/** A climber collider: a ball carried by particles, or a capsule between two carried points. */
type Collider =
  | { kind: "ball"; at: MountWeights; r: number; head: boolean }
  | { kind: "capsule"; a: MountWeights; b: MountWeights; r: number };

const blend = (a: MountWeights, b: MountWeights, s: number): MountWeights => [
  ...a.map(([index, weight]) => [index, weight * (1 - s)] as const),
  ...b.map(([index, weight]) => [index, weight * s] as const)
];

/** The near wing's capsule stops a radius short of the tip, so its cap ends where the wing is drawn. */
const WING_END_WEIGHTS = blend(LIMB_JOINT_WEIGHTS.wing, [[PARTICLE_INDEX.wing, 1]], WING_CAPSULE_SHARE);

/** The climber's colliders: body, head, both legs and the near wing; then the free tips' grip balls. */
const resolveColliders = (limbs: Record<MountLimb, MountLimbState>): Collider[] => {
  const colliders: Collider[] = [
    { kind: "ball", at: BODY_CENTRE_WEIGHTS, r: rig.body.r, head: false },
    { kind: "ball", at: HEAD_WEIGHTS, r: rig.head.r, head: true },
    ...LEG_LIMBS.map(
      (limb): Collider => ({
        kind: "capsule",
        a: LIMB_JOINT_WEIGHTS[limb],
        b: [[TIP_INDEX[limb], 1]],
        r: rig.radius[limb]
      })
    ),
    { kind: "capsule", a: LIMB_JOINT_WEIGHTS.wing, b: WING_END_WEIGHTS, r: rig.radius.wing }
  ];

  for (const limb of MOUNT_LIMBS) {
    if (limbs[limb].kind !== "grabbed") {
      colliders.push({ kind: "ball", at: [[TIP_INDEX[limb], 1]], r: MOUNT_WORLD.gripRadius, head: false });
    }
  }

  return colliders;
};

/** Where a ball collider's centre is: the head ball is placed on the head bone, not by its weights. */
const placeBall = (solver: Solver, collider: Extract<Collider, { kind: "ball" }>): MountVec => {
  if (!collider.head) {
    return placeWeighted(solver.points, collider.at);
  }

  const neck = { x: solver.points.x[PARTICLE_INDEX.neck] ?? 0, y: solver.points.y[PARTICLE_INDEX.neck] ?? 0 };
  const beak = { x: solver.points.x[PARTICLE_INDEX.beak] ?? 0, y: solver.points.y[PARTICLE_INDEX.beak] ?? 0 };

  return placeHeadCentre(neck, beak);
};

/** Pushes a ball at `point` (carried by `weights`) out of the floor. */
const resolveFloorContact = (solver: Solver, weights: MountWeights, point: MountVec, radius: number): void => {
  const overlap = point.y + radius - MOUNT_WORLD.floorY;

  if (overlap > 0) {
    pushWeighted(solver, weights, 0, -1, overlap, overlap, true);
  }
};

/**
 * Pushes a ball at `point` out of a static shape along the contact normal. `weights` says which
 * particles carry the point; it is a thunk because building it is the costly part and most pairs
 * the broad phase keeps are not touching.
 */
const resolveShapeContact = (
  solver: Solver,
  weights: () => MountWeights,
  point: MountVec,
  radius: number,
  shape: MountShape,
  nearest: MountVec
): void => {
  const dx = point.x - nearest.x;
  const dy = point.y - nearest.y;
  const reach = radius + shape.r;

  // Clear by the box alone: no square root for a pair that cannot touch.
  if (dx >= reach || dx <= -reach || dy >= reach || dy <= -reach) {
    return;
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  const overlap = reach - length;

  if (overlap <= 0) {
    return;
  }

  const nx = length > 0 ? dx / length : 0;
  const ny = length > 0 ? dy / length : -1;
  pushWeighted(solver, weights(), nx, ny, overlap, overlap, true);
};

const solveContacts = (solver: Solver, colliders: readonly Collider[], near: readonly MountShape[]): void => {
  for (const collider of colliders) {
    if (collider.kind === "ball") {
      resolveFloorContact(solver, collider.at, placeBall(solver, collider), collider.r);

      for (const shape of near) {
        const point = placeBall(solver, collider);
        resolveShapeContact(solver, () => collider.at, point, collider.r, shape, nearestOnShape(shape, point));
      }

      continue;
    }

    resolveFloorContact(solver, collider.a, placeWeighted(solver.points, collider.a), collider.r);
    resolveFloorContact(solver, collider.b, placeWeighted(solver.points, collider.b), collider.r);

    for (const shape of near) {
      const a = placeWeighted(solver.points, collider.a);
      const b = placeWeighted(solver.points, collider.b);
      let s: number;
      let nearest: MountVec;

      if (shape.kind === "circle") {
        s = nearestOnSegment(a.x, a.y, b.x, b.y, shape.c.x, shape.c.y);
        nearest = shape.c;
      } else {
        const pair = nearestBetweenSegments(a, b, shape.a, shape.b);
        s = pair.s;
        nearest = {
          x: shape.a.x + (shape.b.x - shape.a.x) * pair.t,
          y: shape.a.y + (shape.b.y - shape.a.y) * pair.t
        };
      }

      const point = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s };
      resolveShapeContact(solver, () => blend(collider.a, collider.b, s), point, collider.r, shape, nearest);
    }
  }
};

// ---- one tick -------------------------------------------------------------------------------

const readPoint = (points: Points, index: number): MountVec => ({ x: points.x[index] ?? 0, y: points.y[index] ?? 0 });

const setPoint = (points: Points, index: number, point: MountVec): void => {
  points.x[index] = point.x;
  points.y[index] = point.y;
};

const limbOfTip = (index: number): MountLimb | null =>
  MOUNT_LIMBS.find((limb) => TIP_INDEX[limb] === index) ?? null;

/** (2) Verlet: every free particle keeps its damped velocity, gains gravity, and moves no faster than `maxSpeed`. */
const integrate = (solver: Solver, limbs: Record<MountLimb, MountLimbState>): void => {
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const limb = limbOfTip(index);
    const kind = limb === null ? null : limbs[limb].kind;

    if (kind === "grabbed" || kind === "held") {
      continue;
    }

    const x = solver.points.x[index] ?? 0;
    const y = solver.points.y[index] ?? 0;
    let vx = (x - (solver.previous.x[index] ?? 0)) * MOUNT_WORLD.damping;
    let vy = (y - (solver.previous.y[index] ?? 0)) * MOUNT_WORLD.damping + MOUNT_WORLD.gravity;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > MOUNT_WORLD.maxSpeed) {
      vx = (vx / speed) * MOUNT_WORLD.maxSpeed;
      vy = (vy / speed) * MOUNT_WORLD.maxSpeed;
    }

    solver.previous.x[index] = x;
    solver.previous.y[index] = y;
    solver.points.x[index] = x + vx;
    solver.points.y[index] = y + vy;
  }
};

const towards = (from: MountVec, to: MountVec, most: number): MountVec => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length <= most) {
    return to;
  }

  return { x: from.x + (dx / length) * most, y: from.y + (dy / length) * most };
};

/**
 * (3) Held limbs. The finger's target is projected onto the bone's circle about the joint. A tip
 * in the air chases it by at most `dragStep`, moving only itself. A planted tip (one that touched
 * a surface last tick) stays put and the torso moves instead, by at most `dragStep`, so the tip
 * comes to lie the way the finger points from the joint: the push-off.
 */
const moveHeldLimbs = (
  solver: Solver,
  before: Points,
  limbs: Record<MountLimb, MountLimbState>,
  touches: Record<MountLimb, Touch | null>
): Record<MountLimb, boolean> => {
  const planted: Record<MountLimb, boolean> = { footLeft: false, footRight: false, wing: false, beak: false };

  for (const limb of MOUNT_LIMBS) {
    const state = limbs[limb];

    if (state.kind !== "held") {
      continue;
    }

    const tipIndex = TIP_INDEX[limb];
    const tip = readPoint(before, tipIndex);
    const joint = placeWeighted(solver.points, LIMB_JOINT_WEIGHTS[limb]);
    const dx = state.target.x - joint.x;
    const dy = state.target.y - joint.y;
    const reach = Math.sqrt(dx * dx + dy * dy);

    if (reach <= 0) {
      setPoint(solver.previous, tipIndex, tip);
      setPoint(solver.points, tipIndex, tip);
      continue;
    }

    const ux = dx / reach;
    const uy = dy / reach;
    const bone = rig.bone[limb];

    const aim = { x: joint.x + ux * bone, y: joint.y + uy * bone };
    const touch = touches[limb];
    // Planted: touching a surface last tick with the finger pressing INTO it, past the tip.
    // A finger lifted off the surface lifts the tip off it instead.
    planted[limb] =
      touch !== null && (state.target.x - tip.x) * touch.normal.x + (state.target.y - tip.y) * touch.normal.y < 0;

    if (!planted[limb]) {
      const next = towards(tip, aim, MOUNT_WORLD.dragStep);
      setPoint(solver.previous, tipIndex, tip);
      setPoint(solver.points, tipIndex, next);
      continue;
    }

    setPoint(solver.previous, tipIndex, tip);
    setPoint(solver.points, tipIndex, tip);
    const wanted = { x: tip.x - ux * bone, y: tip.y - uy * bone };
    const shift = towards(joint, wanted, MOUNT_WORLD.dragStep);
    const shiftX = shift.x - joint.x;
    const shiftY = shift.y - joint.y;

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const owner = limbOfTip(index);
      const kind = owner === null ? null : limbs[owner].kind;

      if (kind === "grabbed" || kind === "held") {
        continue;
      }

      solver.points.x[index] = (solver.points.x[index] ?? 0) + shiftX;
      solver.points.y[index] = (solver.points.y[index] ?? 0) + shiftY;
    }
  }

  return planted;
};

const resolveInverseMasses = (limbs: Record<MountLimb, MountLimbState>, planted: Record<MountLimb, boolean>): Float64Array => {
  const inverseMass = new Float64Array(PARTICLE_COUNT);

  for (const particle of MOUNT_PARTICLES) {
    inverseMass[PARTICLE_INDEX[particle]] = 1 / rig.mass[particle];
  }

  for (const limb of MOUNT_LIMBS) {
    const state = limbs[limb];

    if (state.kind === "grabbed" || (state.kind === "held" && planted[limb])) {
      inverseMass[TIP_INDEX[limb]] = 0;
    }
  }

  return inverseMass;
};

const RUMP_WEIGHTS: MountWeights = [[PARTICLE_INDEX.rump, 1]];

/**
 * How far each tip was from the rump when this tick began. A limp or seeking limb is held there,
 * correcting up to `holdStrength` a tick: a limb nobody is touching keeps the angle it was left at
 * against the body, as Mount Your Friends' limbs do, rather than flopping under gravity. The rump
 * is the anchor because every tip sits well off the line from its joint to the rump, so one
 * distance pins the angle firmly; a second anchor would over-constrain the tip against its bone.
 * A contact or a push-off still moves the limb; gravity on the limb alone does not.
 */
const resolveHolds = (before: Points): Record<MountLimb, number> => {
  const rump = readPoint(before, PARTICLE_INDEX.rump);
  const holds: Record<MountLimb, number> = { footLeft: 0, footRight: 0, wing: 0, beak: 0 };

  for (const limb of MOUNT_LIMBS) {
    holds[limb] = distanceBetween(readPoint(before, TIP_INDEX[limb]), rump);
  }

  return holds;
};

/** The bones, in the one order they are solved: both legs, the near wing, the head, the far wing. */
const BONE_ORDER = ["footLeft", "footRight", "wing", "beak", "wingFar"] as const;

const BONE_TIP: Record<(typeof BONE_ORDER)[number], number> = { ...TIP_INDEX, wingFar: PARTICLE_INDEX.wingFar };

const TORSO_DISTANCES = TORSO_PAIRS.map(
  ([first, second, length]): Distance => ({ from: [[first, 1]], to: [[second, 1]], length, mode: "equal", cap: Infinity })
);

const BONE_DISTANCES: Record<(typeof BONE_ORDER)[number], Distance> = {
  footLeft: { from: LIMB_JOINT_WEIGHTS.footLeft, to: [[BONE_TIP.footLeft, 1]], length: rig.bone.footLeft, mode: "equal", cap: Infinity },
  footRight: { from: LIMB_JOINT_WEIGHTS.footRight, to: [[BONE_TIP.footRight, 1]], length: rig.bone.footRight, mode: "equal", cap: Infinity },
  wing: { from: LIMB_JOINT_WEIGHTS.wing, to: [[BONE_TIP.wing, 1]], length: rig.bone.wing, mode: "equal", cap: Infinity },
  beak: { from: LIMB_JOINT_WEIGHTS.beak, to: [[BONE_TIP.beak, 1]], length: rig.bone.beak, mode: "equal", cap: Infinity },
  wingFar: { from: LIMB_JOINT_WEIGHTS.wingFar, to: [[BONE_TIP.wingFar, 1]], length: rig.bone.wingFar, mode: "equal", cap: Infinity }
};

const LIMITS = rig.limits.map(
  (limit): Distance => ({
    from: [[PARTICLE_INDEX[limit.from], 1]],
    to: [[PARTICLE_INDEX[limit.to], 1]],
    length: limit.min,
    mode: "atLeast",
    cap: Infinity
  })
);

/** (4) The constraint passes, each in the same fixed order. */
const solve = (
  solver: Solver,
  limbs: Record<MountLimb, MountLimbState>,
  planted: Record<MountLimb, boolean>,
  holds: Record<MountLimb, number>,
  colliders: readonly Collider[],
  near: readonly MountShape[]
): void => {
  const braceCap = MOUNT_WORLD.braceStrength / MOUNT_WORLD.solverIterations;
  const holdCap = MOUNT_WORLD.holdStrength / MOUNT_WORLD.solverIterations;

  for (let pass = 0; pass < MOUNT_WORLD.solverIterations; pass += 1) {
    for (const constraint of TORSO_DISTANCES) {
      solveDistance(solver, constraint);
    }

    for (const bone of BONE_ORDER) {
      const state = bone === "wingFar" ? null : limbs[bone];
      // A held tip in the air moves only itself along its bone: waving a limb never moves the bird.
      const swinging = state !== null && bone !== "wingFar" && state.kind === "held" && !planted[bone];

      if (swinging) {
        const anchor = placeWeighted(solver.points, LIMB_JOINT_WEIGHTS[bone]);
        const at = readPoint(solver.points, BONE_TIP[bone]);
        const dx = at.x - anchor.x;
        const dy = at.y - anchor.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
          setPoint(solver.points, BONE_TIP[bone], {
            x: anchor.x + (dx / length) * rig.bone[bone],
            y: anchor.y + (dy / length) * rig.bone[bone]
          });
        }

        continue;
      }

      solveDistance(solver, BONE_DISTANCES[bone]);
    }

    for (const limb of MOUNT_LIMBS) {
      const state = limbs[limb];

      if (state.kind === "held") {
        continue;
      }

      if (state.kind === "grabbed") {
        setPoint(solver.points, TIP_INDEX[limb], state.at);
        solveDistance(solver, {
          from: [[TIP_INDEX[limb], 1]],
          to: BODY_JOINT_WEIGHTS,
          length: state.brace,
          mode: "equal",
          cap: braceCap
        });
        continue;
      }

      solveDistance(solver, { from: [[TIP_INDEX[limb], 1]], to: RUMP_WEIGHTS, length: holds[limb], mode: "equal", cap: holdCap });
    }

    for (const limit of LIMITS) {
      solveDistance(solver, limit);
    }

    solver.normalX.fill(0);
    solver.normalY.fill(0);
    solveContacts(solver, colliders, near);
  }
};

/**
 * (5) Friction: every particle a contact pushed this tick loses `contactFriction` of its sliding.
 * Then the velocity each particle carries into the next tick is held to `maxSpeed`, whatever the
 * solver did to it: constraints that cannot all be met at once (a pinned beak, a brace, a held
 * foot) otherwise bake their tug-of-war into momentum and launch the bird.
 */
const applyFriction = (solver: Solver): void => {
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const nx = solver.normalX[index] ?? 0;
    const ny = solver.normalY[index] ?? 0;
    const x = solver.points.x[index] ?? 0;
    const y = solver.points.y[index] ?? 0;
    let vx = x - (solver.previous.x[index] ?? 0);
    let vy = y - (solver.previous.y[index] ?? 0);

    if (nx !== 0 || ny !== 0) {
      const along = vx * nx + vy * ny;
      vx -= (vx - along * nx) * MOUNT_WORLD.contactFriction;
      vy -= (vy - along * ny) * MOUNT_WORLD.contactFriction;
    }

    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > MOUNT_WORLD.maxSpeed) {
      vx = (vx / speed) * MOUNT_WORLD.maxSpeed;
      vy = (vy / speed) * MOUNT_WORLD.maxSpeed;
    }

    solver.previous.x[index] = x - vx;
    solver.previous.y[index] = y - vy;
  }
};

/**
 * When no particle of the hen (bar the dangling far wing) moved this far in a tick, the tick is
 * undone and the hen is at rest: still, with no velocity. Eight solver passes leave a residue
 * when gravity and a grip cancel, a creep of hundredths a tick that would otherwise never stop;
 * this is static friction for the whole bird. Anything really moving moves far more than this.
 */
const REST_SPEED = 0.05;

/** (5b) Rest: the whole hen barely moved, so it did not move at all. */
const applyRest = (solver: Solver, before: Points): void => {
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    if (index === PARTICLE_INDEX.wingFar) {
      continue;
    }

    const dx = (solver.points.x[index] ?? 0) - (before.x[index] ?? 0);
    const dy = (solver.points.y[index] ?? 0) - (before.y[index] ?? 0);

    if (dx * dx + dy * dy >= REST_SPEED * REST_SPEED) {
      return;
    }
  }

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    if (index === PARTICLE_INDEX.wingFar) {
      continue;
    }

    solver.points.x[index] = before.x[index] ?? 0;
    solver.points.y[index] = before.y[index] ?? 0;
    solver.previous.x[index] = before.x[index] ?? 0;
    solver.previous.y[index] = before.y[index] ?? 0;
  }
};
const copyPoints = (points: Points): Points => ({ x: new Float64Array(points.x), y: new Float64Array(points.y) });

const isTouchingFloor = (point: MountVec, radius: number): boolean =>
  point.y + radius >= MOUNT_WORLD.floorY - FALL_SLOP;

/**
 * The body or the head on the floor, with neither foot holding the floor: a hen that has toppled.
 * A hen squatting over its own feet, or bowing with its beak to the floor, rests its belly or head
 * there without having fallen, so a foot grabbed on the floor keeps it in the climb.
 */
const resolveFallen = (points: Points, limbs: Record<MountLimb, MountLimbState>): boolean => {
  const standing = LEG_LIMBS.some((limb) => {
    const state = limbs[limb];

    return state.kind === "grabbed" && state.surface.kind === "floor";
  });

  if (standing) {
    return false;
  }

  const body = placeWeighted(points, BODY_CENTRE_WEIGHTS);
  const head = placeHeadCentre(readPoint(points, PARTICLE_INDEX.neck), readPoint(points, PARTICLE_INDEX.beak));

  return isTouchingFloor(body, rig.body.r) || isTouchingFloor(head, rig.head.r);
};

/** The step itself, given the samples logged at this tick. */
const stepWith = (state: MountState, samples: readonly MountInputSample[]): MountState => {
  if (state.outcome !== null) {
    return state;
  }

  const events: Events = { grabs: [...state.grabs], letGoes: [...state.letGoes] };
  const limbs = applySamples(state, samples, events);
  const before = toPoints(state.pose);
  const near = resolveNearShapes(state.mesh, before);
  const touches: Record<MountLimb, Touch | null> = { footLeft: null, footRight: null, wing: null, beak: null };

  for (const limb of MOUNT_LIMBS) {
    if (limbs[limb].kind === "held") {
      touches[limb] = resolveTouch(readPoint(before, TIP_INDEX[limb]), MOUNT_WORLD.gripRadius, near);
    }
  }

  const solver: Solver = {
    points: copyPoints(before),
    previous: toPoints(state.previous),
    inverseMass: new Float64Array(PARTICLE_COUNT),
    normalX: new Float64Array(PARTICLE_COUNT),
    normalY: new Float64Array(PARTICLE_COUNT)
  };

  for (const limb of MOUNT_LIMBS) {
    const limbState = limbs[limb];

    if (limbState.kind === "grabbed") {
      setPoint(solver.points, TIP_INDEX[limb], limbState.at);
      setPoint(solver.previous, TIP_INDEX[limb], limbState.at);
    }
  }

  integrate(solver, limbs);
  const planted = moveHeldLimbs(solver, before, limbs, touches);
  solver.inverseMass = resolveInverseMasses(limbs, planted);
  solve(solver, limbs, planted, resolveHolds(before), resolveColliders(limbs), near);
  applyFriction(solver);
  applyRest(solver, before);

  // (6) A seeking tip that touches a surface grabs it where it is.
  const pose = toPose(solver.points);

  for (const limb of MOUNT_LIMBS) {
    if (limbs[limb].kind !== "seeking") {
      continue;
    }

    const touch = resolveTouch(pose[limb], MOUNT_WORLD.gripRadius, near);

    if (touch !== null) {
      limbs[limb] = grabbedAt(pose, limb, touch.surface);
      events.grabs.push({ tick: state.tick, limb });
    }
  }

  const crownHeight = heightOf(placeCrown(pose.neck, pose.beak));
  const bestHeight = Math.max(state.bestHeight, crownHeight);
  const tick = state.tick + 1;

  // (7) A fall: the body or the head on the floor sets the hen upright at the start, still on the clock.
  if (resolveFallen(solver.points, limbs)) {
    const fallen: MountState = {
      ...state,
      tick,
      pose: state.start,
      previous: state.start,
      limbs: resolveStartLimbs(state.start),
      recoveringUntilTick: state.tick + MOUNT_WORLD.fallRecoverTicks,
      bestHeight,
      grabs: events.grabs,
      letGoes: events.letGoes,
      falls: [...state.falls, state.tick]
    };

    return tick >= state.climbTicks ? { ...fallen, outcome: "timeout" } : fallen;
  }

  const next: MountState = {
    ...state,
    tick,
    pose,
    previous: toPose(solver.previous),
    limbs,
    bestHeight,
    grabs: events.grabs,
    letGoes: events.letGoes
  };

  // (8) The mount, then (9) the clock.
  if (crownHeight > state.pile.highLine.height) {
    return { ...next, outcome: "mounted" };
  }

  return tick >= state.climbTicks ? { ...next, outcome: "timeout" } : next;
};

/** One tick: applies every sample whose tick equals `state.tick`, then steps. A terminal state is returned as is. */
export const stepMount = (state: MountState, samples: readonly MountInputSample[]): MountState => {
  return stepWith(
    state,
    samples.filter((sample) => sample.tick === state.tick)
  );
};

/** Steps until `toTick` or a terminal state. The tablet's loop and the wall's mirror both call this. */
export const advanceMount = (state: MountState, samples: readonly MountInputSample[], toTick: number): MountState => {
  let next = state;
  let cursor = 0;

  while (next.outcome === null && next.tick < toTick) {
    while (cursor < samples.length && (samples[cursor]?.tick ?? 0) < next.tick) {
      cursor += 1;
    }

    let end = cursor;

    while (end < samples.length && samples[end]?.tick === next.tick) {
      end += 1;
    }

    next = stepWith(next, samples.slice(cursor, end));
    cursor = end;
  }

  return next;
};

/** A terminal state's result, or null while the climb runs. */
export const resolveMountOutcome = (state: MountState): MountClimbResult | null => {
  if (state.outcome === null) {
    return null;
  }

  const mounted = state.outcome === "mounted";
  const span = state.pile.highLine.height - state.startHeight;
  const reached = span > 0 ? (state.bestHeight - state.startHeight) / span : 0;
  const share = mounted ? 1 : Math.min(TIMEOUT_SHARE_CEILING, Math.max(0, reached));
  const grabs: Partial<Record<MountLimb, MountVec>> = {};

  for (const limb of MOUNT_LIMBS) {
    const limbState = state.limbs[limb];

    if (limbState.kind === "grabbed") {
      grabs[limb] = limbState.at;
    }
  }

  return {
    outcome: state.outcome,
    endTick: state.tick,
    share,
    bestHeight: state.bestHeight,
    falls: state.falls.length,
    hen: { pileIndex: state.pile.hens.length, playerId: state.playerId, pose: state.pose, grabs, mounted }
  };
};

/** The referee: the whole climb from the top to its terminal state. Always terminal: the clock guarantees it. */
export const runMountClimb = (
  seed: number,
  pile: MountPile,
  rules: MountClimbRules,
  playerId: string | null,
  samples: readonly MountInputSample[]
): MountClimbResult => {
  const start = createMountState(seed, pile, rules, playerId);
  const end = advanceMount(start, samples, start.climbTicks);
  const result = resolveMountOutcome(end);

  if (result === null) {
    throw new Error("A climb run to its clock is always terminal.");
  }

  return result;
};
