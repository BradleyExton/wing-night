import type { Segment } from "../../contraption/types.js";
import type { BodyStep } from "../../contraption/simulate/resolveSegmentContacts/index.js";
import { resolveSegmentContacts } from "../../contraption/simulate/resolveSegmentContacts/index.js";
import type {
  JoustAim,
  JoustArena,
  JoustFrame,
  JoustHitZone,
  JoustShotRun,
  JoustSimulateOptions,
  JoustVec2
} from "../types.js";
import {
  JOUST_BODIES,
  JOUST_CHAMP_BALL_INDICES,
  JOUST_CHAMP_BASE_INDEX,
  JOUST_CHAMP_HEAD_INDEX,
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  clampJoustAim,
  resolveJoustLaunchVelocity,
  resolveJoustRestPositions,
  resolveJoustSegments,
  toJoustFrame
} from "../world/index.js";

/**
 * Half a thousandth of a world unit. A shot lined up exactly on a segment endpoint or dead-centre
 * on the champ's head otherwise resolves into a degenerate, unwatchable frame; the seed nudges
 * every shooter body off that knife edge reproducibly.
 */
const JITTER_UNITS = 0.0005;
const DEFAULT_SEED_STATE = 0x9e3779b9 | 0;
const UINT32_RANGE = 4294967296;

/** How many constraint passes settle the chains each step. */
const CONSTRAINT_ITERATIONS = 4;
/** Second-neighbour stiffness: enough that the shooter reads as a body, not a rope. */
const BEND_STIFFNESS = 0.45;
/** Per-step pull of each champ body toward where it stands, so it wobbles and rights itself. */
const CHAMP_HOME_STIFFNESS = 0.018;
const CHAMP_DAMPING = 0.985;
const SHOOTER_DAMPING = 0.999;
const SHOOTER_RESTITUTION = 0.32;
const SHOOTER_SLIP = 0.7;
const CHAMP_RESTITUTION = 0.15;
const CHAMP_SLIP = 0.9;

/**
 * A frame-to-frame move below this reads as stopped from across a room. Looser than
 * CONTRAPTION's, because a shooter draped over a cactus edge keeps trading sub-tenth wobbles
 * between its links and the surface indefinitely.
 */
const SETTLE_EPSILON_UNITS = 0.12;
const SETTLE_FRAMES = 8;
/** Never cut a track shorter than this, even if nothing moves — the room needs to see it land. */
const MIN_DURATION_SECONDS = 1;
/** Past here a shooter body is gone for good and the track has nothing left to show. */
const OUT_OF_BOUNDS_MARGIN = 14;

type Body = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  readonly radius: number;
  readonly pinned: boolean;
  readonly isShooter: boolean;
  readonly homeX: number;
  readonly homeY: number;
};

type DistanceConstraint = {
  readonly a: number;
  readonly b: number;
  readonly rest: number;
  readonly stiffness: number;
};

/**
 * xorshift32 — integer operations only, so every engine implementing ES2022 bit operators yields
 * the identical stream. The platform PRNG is excluded for the opposite reason: it is not
 * reproducible at all.
 */
const nextSeedState = (state: number): number => {
  let next = state | 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next | 0;
};

const seedStateFrom = (seed: number): number => {
  const truncated = seed | 0;
  return truncated === 0 ? DEFAULT_SEED_STATE : truncated;
};

const unitFromState = (state: number): number => {
  return (state >>> 0) / UINT32_RANGE;
};

const assertOptions = (options: JoustSimulateOptions): void => {
  if (!Number.isFinite(options.seed)) {
    throw new RangeError("simulateJoustShot: seed must be a finite number");
  }
  if (!(options.maxDurationSeconds > 0) || !Number.isFinite(options.maxDurationSeconds)) {
    throw new RangeError(
      "simulateJoustShot: maxDurationSeconds must be a positive finite number"
    );
  }
  if (!Number.isInteger(options.stepHz) || options.stepHz <= 0) {
    throw new RangeError("simulateJoustShot: stepHz must be a positive integer");
  }
  if (!Number.isInteger(options.keyframeHz) || options.keyframeHz <= 0) {
    throw new RangeError("simulateJoustShot: keyframeHz must be a positive integer");
  }
  if (options.stepHz % options.keyframeHz !== 0) {
    throw new RangeError(
      `simulateJoustShot: stepHz (${options.stepHz}) must be a whole multiple of keyframeHz (${options.keyframeHz})`
    );
  }
};

const distanceBetween = (a: JoustVec2, b: JoustVec2): number => {
  const deltaX = b.x - a.x;
  const deltaY = b.y - a.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const isChampPinned = (bodyIndex: number): boolean => {
  return (
    bodyIndex === JOUST_CHAMP_BASE_INDEX ||
    JOUST_CHAMP_BALL_INDICES.some((ballIndex) => ballIndex === bodyIndex)
  );
};

const buildBodies = (
  rest: readonly JoustVec2[],
  launch: JoustVec2,
  stepSeconds: number,
  seed: number
): Body[] => {
  let seedState = seedStateFrom(seed);

  return rest.map((position, bodyIndex): Body => {
    const descriptor = JOUST_BODIES[bodyIndex];
    const isShooter = bodyIndex < JOUST_SHOOTER_BODY_COUNT;
    let x = position.x;
    let y = position.y;

    if (isShooter) {
      seedState = nextSeedState(seedState);
      x += (unitFromState(seedState) * 2 - 1) * JITTER_UNITS;
      seedState = nextSeedState(seedState);
      y += (unitFromState(seedState) * 2 - 1) * JITTER_UNITS;
    }

    return {
      x,
      y,
      // Position-Verlet keeps velocity implicit: the launch is written by placing the previous
      // centre one step behind along the launch vector.
      previousX: isShooter ? x - launch.x * stepSeconds : x,
      previousY: isShooter ? y - launch.y * stepSeconds : y,
      radius: descriptor?.radius ?? 0,
      pinned: !isShooter && isChampPinned(bodyIndex),
      isShooter,
      homeX: x,
      homeY: y
    };
  });
};

const buildConstraints = (rest: readonly JoustVec2[]): DistanceConstraint[] => {
  const restBetween = (a: number, b: number): number => {
    const first = rest[a];
    const second = rest[b];
    return first === undefined || second === undefined ? 0 : distanceBetween(first, second);
  };
  const constraints: DistanceConstraint[] = [];

  // Shooter: a chain from tail to head, stiffened across every second link so it flops rather
  // than folds, with the balls hung off the tail.
  for (let index = 0; index < JOUST_SHOOTER_HEAD_INDEX; index += 1) {
    constraints.push({ a: index, b: index + 1, rest: restBetween(index, index + 1), stiffness: 1 });
  }
  for (let index = 0; index + 2 <= JOUST_SHOOTER_HEAD_INDEX; index += 1) {
    constraints.push({
      a: index,
      b: index + 2,
      rest: restBetween(index, index + 2),
      stiffness: BEND_STIFFNESS
    });
  }
  for (const ballIndex of JOUST_SHOOTER_BALL_INDICES) {
    constraints.push({ a: 0, b: ballIndex, rest: restBetween(0, ballIndex), stiffness: 1 });
    constraints.push({ a: 1, b: ballIndex, rest: restBetween(1, ballIndex), stiffness: 1 });
  }
  constraints.push({
    a: JOUST_SHOOTER_BALL_INDICES[0],
    b: JOUST_SHOOTER_BALL_INDICES[1],
    rest: restBetween(JOUST_SHOOTER_BALL_INDICES[0], JOUST_SHOOTER_BALL_INDICES[1]),
    stiffness: 1
  });

  // Champ: a chain from the pinned base up to the head. Its balls are pinned to the floor, so
  // they need no links; the home spring in `settleChamp` is what keeps it standing.
  for (let index = JOUST_CHAMP_BASE_INDEX; index < JOUST_CHAMP_HEAD_INDEX; index += 1) {
    constraints.push({ a: index, b: index + 1, rest: restBetween(index, index + 1), stiffness: 1 });
  }
  for (let index = JOUST_CHAMP_BASE_INDEX; index + 2 <= JOUST_CHAMP_HEAD_INDEX; index += 1) {
    constraints.push({
      a: index,
      b: index + 2,
      rest: restBetween(index, index + 2),
      stiffness: BEND_STIFFNESS
    });
  }

  return constraints;
};

const integrate = (bodies: Body[], gravityStep: number): void => {
  for (const body of bodies) {
    if (body.pinned) {
      continue;
    }

    const damping = body.isShooter ? SHOOTER_DAMPING : CHAMP_DAMPING;
    const velocityX = (body.x - body.previousX) * damping;
    const velocityY = (body.y - body.previousY) * damping;

    body.previousX = body.x;
    body.previousY = body.y;
    body.x += velocityX;
    body.y += velocityY + gravityStep;
  }
};

const relax = (bodies: Body[], constraints: readonly DistanceConstraint[]): void => {
  for (const constraint of constraints) {
    const a = bodies[constraint.a];
    const b = bodies[constraint.b];

    if (a === undefined || b === undefined) {
      continue;
    }

    const deltaX = b.x - a.x;
    const deltaY = b.y - a.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance === 0) {
      continue;
    }

    const weightA = a.pinned ? 0 : 1;
    const weightB = b.pinned ? 0 : 1;
    const totalWeight = weightA + weightB;

    if (totalWeight === 0) {
      continue;
    }

    const correction = ((distance - constraint.rest) / distance) * constraint.stiffness;
    const shareA = correction * (weightA / totalWeight);
    const shareB = correction * (weightB / totalWeight);

    a.x += deltaX * shareA;
    a.y += deltaY * shareA;
    b.x -= deltaX * shareB;
    b.y -= deltaY * shareB;
  }
};

/** Pinned bodies never drift; free champ bodies are drawn back toward standing. */
const settleChamp = (bodies: Body[]): void => {
  for (const body of bodies) {
    if (body.isShooter) {
      continue;
    }

    if (body.pinned) {
      body.x = body.homeX;
      body.y = body.homeY;
      body.previousX = body.homeX;
      body.previousY = body.homeY;
      continue;
    }

    body.x += (body.homeX - body.x) * CHAMP_HOME_STIFFNESS;
    body.y += (body.homeY - body.y) * CHAMP_HOME_STIFFNESS;
  }
};

const collideWithSegments = (bodies: Body[], segments: readonly Segment[]): void => {
  for (const body of bodies) {
    if (body.pinned) {
      continue;
    }

    const step: BodyStep = {
      x: body.x,
      y: body.y,
      previousX: body.previousX,
      previousY: body.previousY
    };
    const resolved = resolveSegmentContacts(
      step,
      {
        radius: body.radius,
        restitution: body.isShooter ? SHOOTER_RESTITUTION : CHAMP_RESTITUTION,
        slip: body.isShooter ? SHOOTER_SLIP : CHAMP_SLIP
      },
      segments
    );

    body.x = resolved.x;
    body.y = resolved.y;
    body.previousX = resolved.previousX;
    body.previousY = resolved.previousY;
  }
};

const zoneOf = (champIndex: number): JoustHitZone => {
  if (champIndex === JOUST_CHAMP_HEAD_INDEX) {
    return "head";
  }
  if (JOUST_CHAMP_BALL_INDICES.some((ballIndex) => ballIndex === champIndex)) {
    return "balls";
  }
  return "shaft";
};

/**
 * Shooter bodies against champ bodies. Overlaps are pushed apart, split evenly unless the champ
 * side is pinned; the first overlap of the whole run is the hit that scores.
 */
const collideShooterWithChamp = (bodies: Body[]): JoustHitZone | null => {
  let firstZone: JoustHitZone | null = null;

  for (let shooterIndex = 0; shooterIndex < JOUST_SHOOTER_BODY_COUNT; shooterIndex += 1) {
    const shooter = bodies[shooterIndex];

    if (shooter === undefined) {
      continue;
    }

    for (let champIndex = JOUST_CHAMP_BASE_INDEX; champIndex < bodies.length; champIndex += 1) {
      const champ = bodies[champIndex];

      if (champ === undefined) {
        continue;
      }

      const deltaX = champ.x - shooter.x;
      const deltaY = champ.y - shooter.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const minimum = shooter.radius + champ.radius;

      if (distance >= minimum || distance === 0) {
        continue;
      }

      if (firstZone === null) {
        firstZone = zoneOf(champIndex);
      }

      const overlap = minimum - distance;
      const normalX = deltaX / distance;
      const normalY = deltaY / distance;

      if (champ.pinned) {
        shooter.x -= normalX * overlap;
        shooter.y -= normalY * overlap;
        continue;
      }

      shooter.x -= normalX * overlap * 0.5;
      shooter.y -= normalY * overlap * 0.5;
      champ.x += normalX * overlap * 0.5;
      champ.y += normalY * overlap * 0.5;
    }
  }

  return firstZone;
};

const maxDisplacement = (before: JoustFrame, after: JoustFrame): number => {
  let largest = 0;

  for (let index = 0; index + 1 < after.length; index += 2) {
    const deltaX = (after[index] ?? 0) - (before[index] ?? 0);
    const deltaY = (after[index + 1] ?? 0) - (before[index + 1] ?? 0);
    largest = Math.max(largest, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
  }

  return largest;
};

const isShooterGone = (bodies: readonly Body[]): boolean => {
  for (let index = 0; index < JOUST_SHOOTER_BODY_COUNT; index += 1) {
    const body = bodies[index];

    if (body === undefined) {
      continue;
    }

    const beyondRight = body.x > JOUST_WORLD.width + OUT_OF_BOUNDS_MARGIN;
    const beyondBottom = body.y > JOUST_WORLD.height + OUT_OF_BOUNDS_MARGIN;

    if (!beyondRight && !beyondBottom) {
      return false;
    }
  }

  return true;
};

const toSegments = (arena: JoustArena): Segment[] => {
  return resolveJoustSegments(arena).map((segment, index) => ({
    id: `segment-${index}`,
    from: segment.from,
    to: segment.to
  }));
};

/**
 * Fires one shot and returns the keyframe track a display would replay, plus where — if
 * anywhere — it first touched the champ.
 *
 * Pure and dependency-free by construction: same arena + same aim + same seed ⇒ the same track,
 * every time. The track is cut as soon as the scene has settled or the shooter has left the
 * world, so a clean miss into the void and a wobble-and-topple both end near the moment the
 * room stops caring.
 */
export const simulateJoustShot = (
  arena: JoustArena,
  aim: JoustAim,
  options: JoustSimulateOptions
): JoustShotRun => {
  assertOptions(options);

  const clampedAim = clampJoustAim(aim);
  const stepSeconds = 1 / options.stepHz;
  const gravityStep = JOUST_WORLD.gravity * stepSeconds * stepSeconds;
  const stepsPerKeyframe = options.stepHz / options.keyframeHz;
  const totalSteps = Math.round(options.maxDurationSeconds * options.stepHz);
  const minSteps = Math.round(MIN_DURATION_SECONDS * options.stepHz);

  const rest = resolveJoustRestPositions(arena, clampedAim);
  const bodies = buildBodies(
    rest,
    resolveJoustLaunchVelocity(clampedAim),
    stepSeconds,
    options.seed
  );
  const constraints = buildConstraints(rest);
  const segments = toSegments(arena);

  const keyframes: JoustFrame[] = [toJoustFrame(bodies)];
  let hitZone: JoustHitZone | null = null;
  let hitFrameIndex: number | null = null;
  let stillFrames = 0;

  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
    integrate(bodies, gravityStep);

    for (let iteration = 0; iteration < CONSTRAINT_ITERATIONS; iteration += 1) {
      relax(bodies, constraints);
      settleChamp(bodies);
    }

    collideWithSegments(bodies, segments);

    const contactZone = collideShooterWithChamp(bodies);

    if (contactZone !== null && hitZone === null) {
      hitZone = contactZone;
      hitFrameIndex = keyframes.length;
    }

    if (stepIndex % stepsPerKeyframe !== 0) {
      continue;
    }

    const frame = toJoustFrame(bodies);
    const previous = keyframes[keyframes.length - 1];

    keyframes.push(frame);
    stillFrames =
      previous !== undefined && maxDisplacement(previous, frame) <= SETTLE_EPSILON_UNITS
        ? stillFrames + 1
        : 0;

    if (stepIndex >= minSteps && (stillFrames >= SETTLE_FRAMES || isShooterGone(bodies))) {
      break;
    }
  }

  return {
    keyframeHz: options.keyframeHz,
    keyframes,
    hitZone,
    hitFrameIndex: hitFrameIndex === null ? null : Math.min(hitFrameIndex, keyframes.length - 1)
  };
};
