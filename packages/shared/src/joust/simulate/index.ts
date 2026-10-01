import type { Segment } from "../../contraption/types.js";
import type { BodyStep } from "../../contraption/simulate/resolveSegmentContacts/index.js";
import { resolveSegmentContacts } from "../../contraption/simulate/resolveSegmentContacts/index.js";
import { createXorshift32 } from "../../seededRandom/index.js";
import { JOUST_STANDARD_SHOOTER_PROFILE } from "../shooterProfile/index.js";
import type {
  JoustAim,
  JoustArena,
  JoustCollapse,
  JoustFrame,
  JoustShooterProfile,
  JoustShotRun,
  JoustSimulateOptions,
  JoustTopple,
  JoustVec2
} from "../types.js";
import {
  JOUST_PIN_CHEST,
  JOUST_PIN_FOOT_RADIUS,
  JOUST_PIN_HEAD_FORWARD,
  JOUST_PIN_HEAD_RADIUS,
  JOUST_PIN_HEIGHT,
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_TOPPLE_TILT,
  JOUST_TOWER_TOPPLE_TILT,
  JOUST_WORLD,
  clampJoustAim,
  joustLegFootIndex,
  joustLegTopIndex,
  joustPinFootIndex,
  joustPinHeadIndex,
  resolveJoustBodies,
  resolveJoustLaunchVelocity,
  resolveJoustLeanTilt,
  resolveJoustLegs,
  resolveJoustPinPerchIndex,
  resolveJoustPinTilt,
  resolveJoustRestPositions,
  resolveJoustStaticSegments,
  resolvePerchSlabSegments,
  toJoustFrame
} from "../world/index.js";

/**
 * Half a thousandth of a world unit. A shot lined up exactly on a segment endpoint or dead-centre
 * on a pin's head otherwise resolves into a degenerate, unwatchable frame; the seed nudges every
 * shooter body off that knife edge reproducibly.
 */
const JITTER_UNITS = 0.0005;

/** How many constraint passes settle the chains each step. */
const CONSTRAINT_ITERATIONS = 4;
/**
 * Everything about the SHOT — its second-neighbour stiffness, its damping, how it bounces, how
 * heavy it is next to a pin or a leg, how hard the band throws it — comes off the kind's
 * `JoustShooterProfile` (`options.shooter`). The Standard profile is the constants that used to
 * sit here; the numbers below are the RACK's and the TOWERS', which no kind changes.
 */
/**
 * Per-step pull of a wobbling pin's head back over its own foot — what keeps it on its feet. It is
 * there to stand the rack against its own jitter and a neighbour's nudge, NOT against the shot: at
 * 0.08 it won a tug of war with any contact under about sixty units a second, and the room watched
 * a schlong lean on a bird that then shrugged it off (the 2026-10-01 sweep: 60% of birds the
 * capsule touched were still standing). Halved, a soft hit still goes over.
 */
const PIN_UPRIGHT_STIFFNESS = 0.04;
/**
 * How far a pin may lean and still recover. A pin is bistable like the real thing: inside this
 * band it rights itself, and past it nothing holds it up — gravity swings the head down about the
 * planted foot and it is going over. Without the cliff the rack is a rubber wall that returns the
 * shot instead of taking it. Passing it is a one-way door (`Pin.falling`): the spring never comes
 * back for a pin that has been past here, and its foot is let go of (see `settlePins`), so a bird
 * leaning well past recovery cannot be stood back up by its own foot sliding home under it — which
 * is exactly what the rigid stick used to do to a third of the hits that should have counted.
 */
const PIN_RECOVERY_TILT = 0.1;
/** Per-step pull of a pin's foot back onto its column, so a glancing blow does not walk it away. */
const PIN_FOOT_STIFFNESS = 0.06;
/**
 * How much of its own stick's correction a pin's FOOT takes against its head. A foot planted on
 * the sand is the heavy end: push the head and the bird rotates about its feet, the way a thing
 * standing up falls over. At an even split a sideways shove slid the foot out from under the head
 * instead, and the foot spring then dragged it back and the bird with it.
 */
const PIN_FOOT_SHARE = 0.15;
/** A pin that is over keeps only enough of that pull to stop it sliding off screen. */
const PIN_FOOT_STIFFNESS_DOWN = 0.012;
const PIN_DAMPING = 0.985;
const PIN_RESTITUTION = 0.15;
const PIN_SLIP = 0.9;

/**
 * A tower's leg is the same bistable stick as a pin, only built to hold a shelf up: it is pulled
 * upright harder, gives up later, and — the part that matters — is HEAVY. The shooter absorbs
 * most of a leg contact (the profile's `legShare`), so a glancing shot bounces off and only a
 * shot with real weight behind it folds a tower. Both legs share one slab, so folding one means
 * moving both: a tower takes about twice the push a pin does before it goes.
 */
const LEG_UPRIGHT_STIFFNESS = 0.04;
const LEG_RECOVERY_TILT = 0.12;
const LEG_FOOT_STIFFNESS = 0.12;
const LEG_FOOT_STIFFNESS_DOWN = 0.02;
/** How much of a pin-versus-leg separation the PIN absorbs: a bird bounces off timber. */
const PIN_LEG_SHARE = 0.85;
const LEG_RESTITUTION = 0.1;
const LEG_SLIP = 0.9;
/**
 * The sideways shove a dropped player's head gets on the frame their tower folds, in world units a
 * step, in the direction the tower is falling. A pin that simply loses its floor falls perfectly
 * upright and lands standing; this is what turns the drop into a tumble.
 */
const DROP_KICK_UNITS = 0.12;

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

type BodyRole = "shooter" | "pin" | "leg";

type Body = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  readonly radius: number;
  readonly role: BodyRole;
  /** Which pin this body belongs to, so a pin never collides with its own other half. */
  readonly pinIndex: number | null;
};

type Pin = {
  readonly footIndex: number;
  readonly headIndex: number;
  readonly homeX: number;
  homeY: number;
  /** The perch this pin stands on, so its tower folding can take it down. Null on bare sand. */
  readonly perchIndex: number | null;
  /** Past the recovery band at least once this shot: committed to going over. */
  falling: boolean;
  toppled: boolean;
  /** Where this pin's foot-to-head stick sits in the constraint list. */
  stickIndex: number;
};

type Leg = {
  readonly footIndex: number;
  readonly topIndex: number;
  readonly homeX: number;
  readonly homeY: number;
  readonly height: number;
  readonly towerIndex: number;
};

type Tower = {
  readonly perchIndex: number;
  readonly legIndices: readonly number[];
  readonly slabSegments: readonly Segment[];
  collapsed: boolean;
};

type DistanceConstraint = {
  readonly a: number;
  readonly b: number;
  readonly rest: number;
  readonly stiffness: number;
  /**
   * How much of the correction `a` takes; `b` takes the rest. Even when absent. Mutable, because a
   * pin's foot stops being its heavy end the moment the pin is over (`stickEvenly`).
   */
  aShare?: number;
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

const buildBodies = (
  rest: readonly JoustVec2[],
  pinCount: number,
  legCount: number,
  launch: JoustVec2,
  stepSeconds: number,
  seed: number,
  profile: JoustShooterProfile
): Body[] => {
  const descriptors = resolveJoustBodies(pinCount, legCount, profile);
  const firstLegBody = joustLegFootIndex(pinCount, 0);
  const jitter = createXorshift32(seed);

  return rest.map((position, bodyIndex): Body => {
    const descriptor = descriptors[bodyIndex];
    const isShooter = bodyIndex < JOUST_SHOOTER_BODY_COUNT;
    const isLeg = bodyIndex >= firstLegBody;
    let x = position.x;
    let y = position.y;

    if (isShooter) {
      x += (jitter() * 2 - 1) * JITTER_UNITS;
      y += (jitter() * 2 - 1) * JITTER_UNITS;
    }

    return {
      x,
      y,
      // Position-Verlet keeps velocity implicit: the launch is written by placing the previous
      // centre one step behind along the launch vector.
      previousX: isShooter ? x - launch.x * stepSeconds : x,
      previousY: isShooter ? y - launch.y * stepSeconds : y,
      radius: descriptor?.radius ?? 0,
      role: isShooter ? "shooter" : isLeg ? "leg" : "pin",
      pinIndex:
        isShooter || isLeg ? null : Math.floor((bodyIndex - JOUST_SHOOTER_BODY_COUNT) / 2)
    };
  });
};

const buildPins = (arena: JoustArena): Pin[] => {
  return arena.pinFeet.map((foot, pinIndex) => ({
    footIndex: joustPinFootIndex(pinIndex),
    headIndex: joustPinHeadIndex(pinIndex),
    homeX: foot.x,
    homeY: foot.y,
    perchIndex: resolveJoustPinPerchIndex(foot, arena.perches),
    falling: false,
    toppled: false,
    stickIndex: -1
  }));
};

/** Every standing tower and the legs under it, legs in `resolveJoustLegs` (frame) order. */
const buildTowers = (
  arena: JoustArena,
  pinCount: number
): { towers: Tower[]; legs: Leg[] } => {
  const legs: Leg[] = [];
  const towers: Tower[] = [];

  resolveJoustLegs(arena.perches, arena.collapsedPerchIndices ?? []).forEach((leg, legIndex) => {
    let towerIndex = towers.findIndex((tower) => tower.perchIndex === leg.perchIndex);

    if (towerIndex === -1) {
      const perch = arena.perches[leg.perchIndex];

      towerIndex = towers.length;
      towers.push({
        perchIndex: leg.perchIndex,
        legIndices: [],
        slabSegments:
          perch === undefined
            ? []
            : resolvePerchSlabSegments(perch).map((segment, index) => ({
                id: `slab-${leg.perchIndex}-${index}`,
                from: segment.from,
                to: segment.to
              })),
        collapsed: false
      });
    }

    const tower = towers[towerIndex];

    if (tower !== undefined) {
      (tower.legIndices as number[]).push(legIndex);
    }

    legs.push({
      footIndex: joustLegFootIndex(pinCount, legIndex),
      topIndex: joustLegTopIndex(pinCount, legIndex),
      homeX: leg.x,
      homeY: leg.footY,
      height: leg.footY - leg.topY,
      towerIndex
    });
  });

  return { towers, legs };
};

const buildConstraints = (
  rest: readonly JoustVec2[],
  pins: Pin[],
  legs: readonly Leg[],
  towers: readonly Tower[],
  profile: JoustShooterProfile
): DistanceConstraint[] => {
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
      stiffness: profile.bendStiffness
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

  // A pin is a rigid stick: one link, foot to head, the foot the heavy end. What holds it UPRIGHT
  // is the spring in `settlePins`, which is the thing a shot is allowed to beat.
  for (const pin of pins) {
    pin.stickIndex = constraints.length;
    constraints.push({
      a: pin.footIndex,
      b: pin.headIndex,
      rest: JOUST_PIN_HEIGHT,
      stiffness: 1,
      aShare: PIN_FOOT_SHARE
    });
  }

  // A leg is the same stick, its own height. The slab ties the two tops together, so a tower is
  // a frame that can only shear: push one leg and the other has to come with it.
  for (const leg of legs) {
    constraints.push({ a: leg.footIndex, b: leg.topIndex, rest: leg.height, stiffness: 1 });
  }
  for (const tower of towers) {
    const [first, second] = tower.legIndices;
    const firstLeg = first === undefined ? undefined : legs[first];
    const secondLeg = second === undefined ? undefined : legs[second];

    if (firstLeg !== undefined && secondLeg !== undefined) {
      constraints.push({
        a: firstLeg.topIndex,
        b: secondLeg.topIndex,
        rest: restBetween(firstLeg.topIndex, secondLeg.topIndex),
        stiffness: 1
      });
    }
  }

  return constraints;
};

const integrate = (bodies: Body[], gravityStep: number, shooterDamping: number): void => {
  for (const body of bodies) {
    const damping = body.role === "shooter" ? shooterDamping : PIN_DAMPING;
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

    const correction = ((distance - constraint.rest) / distance) * constraint.stiffness;
    const aShare = constraint.aShare ?? 0.5;

    a.x += deltaX * correction * aShare;
    a.y += deltaY * correction * aShare;
    b.x -= deltaX * correction * (1 - aShare);
    b.y -= deltaY * correction * (1 - aShare);
  }
};

/**
 * What keeps the rack standing: a pin's foot is drawn back onto its own spot — the sand, or the
 * perch it was stood on — and while it is only wobbling, its head is drawn back over that foot. A
 * pin that has gone over keeps only the sideways part of that pull, so a player knocked off a
 * tower falls off it instead of being held in the air. Past `PIN_RECOVERY_TILT` the pin is
 * FALLING: the spring stops for good and the foot is held to its spot no harder than a toppled
 * pin's, so it goes all the way over instead of springing back up — which is the whole game, and
 * the reason a felled player can be counted once and left out of the next shot. It is still
 * stood on its floor until it is counted, so a bird going over on a shelf goes over ON the shelf.
 */
const settlePins = (bodies: Body[], pins: Pin[]): void => {
  for (const pin of pins) {
    const foot = bodies[pin.footIndex];
    const head = bodies[pin.headIndex];

    if (foot === undefined || head === undefined) {
      continue;
    }

    if (!pin.falling && resolveJoustPinTilt(foot, head) > PIN_RECOVERY_TILT) {
      pin.falling = true;
    }

    foot.x += (pin.homeX - foot.x) * (pin.falling ? PIN_FOOT_STIFFNESS_DOWN : PIN_FOOT_STIFFNESS);

    if (pin.toppled) {
      continue;
    }

    foot.y += (pin.homeY - foot.y) * PIN_FOOT_STIFFNESS;

    if (pin.falling) {
      continue;
    }

    head.x += (foot.x - head.x) * PIN_UPRIGHT_STIFFNESS;
    head.y += (foot.y - JOUST_PIN_HEIGHT - head.y) * PIN_UPRIGHT_STIFFNESS;
  }
};

/**
 * The same bistable spring for a tower's legs, wound tighter. A folded tower keeps only the
 * sideways foot pull, so its frame lands where it fell instead of skating down the lane.
 */
const settleLegs = (bodies: Body[], legs: readonly Leg[], towers: readonly Tower[]): void => {
  for (const leg of legs) {
    const foot = bodies[leg.footIndex];
    const top = bodies[leg.topIndex];
    const tower = towers[leg.towerIndex];

    if (foot === undefined || top === undefined || tower === undefined) {
      continue;
    }

    const footStiffness = tower.collapsed ? LEG_FOOT_STIFFNESS_DOWN : LEG_FOOT_STIFFNESS;

    foot.x += (leg.homeX - foot.x) * footStiffness;

    if (tower.collapsed) {
      continue;
    }

    foot.y += (leg.homeY - foot.y) * footStiffness;

    if (resolveJoustLeanTilt(foot, top, leg.height) > LEG_RECOVERY_TILT) {
      continue;
    }

    top.x += (foot.x - top.x) * LEG_UPRIGHT_STIFFNESS;
    top.y += (foot.y - leg.height - top.y) * LEG_UPRIGHT_STIFFNESS;
  }
};

/**
 * A pin that is over is a loose stick, not a thing standing on heavy feet: its two ends weigh the
 * same from here, so it tumbles and lands flat instead of balancing on its head on whatever broke
 * its fall with its feet in the air.
 */
const stickEvenly = (pin: Pin, constraints: DistanceConstraint[]): void => {
  const stick = constraints[pin.stickIndex];

  if (stick !== undefined) {
    stick.aShare = 0.5;
  }
};

/** Latches every pin that has just passed the point of no return, newest columns last. */
const latchTopples = (
  bodies: readonly Body[],
  pins: Pin[],
  constraints: DistanceConstraint[],
  frameIndex: number,
  topples: JoustTopple[]
): void => {
  for (const [pinIndex, pin] of pins.entries()) {
    const foot = bodies[pin.footIndex];
    const head = bodies[pin.headIndex];

    if (pin.toppled || foot === undefined || head === undefined) {
      continue;
    }

    if (resolveJoustPinTilt(foot, head) > JOUST_TOPPLE_TILT) {
      pin.toppled = true;
      stickEvenly(pin, constraints);
      topples.push({ pinIndex, frameIndex });
    }
  }
};

/**
 * A tower whose leg has leaned past `JOUST_TOWER_TOPPLE_TILT` is down: its slab stops being a
 * floor, and everybody stood on it is dropped and counted on this frame — a player whose tower
 * fell out from under them is over, wherever they land. Their heads get a shove the way the tower
 * is going, so they tumble off it rather than riding it down standing up.
 */
const latchCollapses = (
  bodies: Body[],
  towers: Tower[],
  legs: readonly Leg[],
  pins: Pin[],
  constraints: DistanceConstraint[],
  frameIndex: number,
  collapses: JoustCollapse[],
  topples: JoustTopple[]
): boolean => {
  let didCollapse = false;

  for (const tower of towers) {
    if (tower.collapsed) {
      continue;
    }

    let lean = 0;

    for (const legIndex of tower.legIndices) {
      const leg = legs[legIndex];
      const foot = leg === undefined ? undefined : bodies[leg.footIndex];
      const top = leg === undefined ? undefined : bodies[leg.topIndex];

      if (leg === undefined || foot === undefined || top === undefined) {
        continue;
      }

      if (resolveJoustLeanTilt(foot, top, leg.height) > JOUST_TOWER_TOPPLE_TILT) {
        lean = top.x - foot.x;
      }
    }

    if (lean === 0) {
      continue;
    }

    tower.collapsed = true;
    didCollapse = true;
    collapses.push({ perchIndex: tower.perchIndex, frameIndex });

    const direction = lean > 0 ? 1 : -1;

    for (const [pinIndex, pin] of pins.entries()) {
      const head = bodies[pin.headIndex];

      if (pin.toppled || pin.perchIndex !== tower.perchIndex || head === undefined) {
        continue;
      }

      pin.toppled = true;
      stickEvenly(pin, constraints);
      pin.homeY = JOUST_WORLD.floorY - JOUST_PIN_FOOT_RADIUS;
      head.previousX -= DROP_KICK_UNITS * direction;
      topples.push({ pinIndex, frameIndex });
    }
  }

  return didCollapse;
};

const collideWithSegments = (
  bodies: Body[],
  segments: readonly Segment[],
  staticSegments: readonly Segment[],
  profile: JoustShooterProfile
): void => {
  for (const body of bodies) {
    const step: BodyStep = {
      x: body.x,
      y: body.y,
      previousX: body.previousX,
      previousY: body.previousY
    };
    const resolved = resolveSegmentContacts(
      step,
      body.role === "shooter"
        ? { radius: body.radius, restitution: profile.restitution, slip: profile.slip }
        : body.role === "leg"
          ? { radius: body.radius, restitution: LEG_RESTITUTION, slip: LEG_SLIP }
          : { radius: body.radius, restitution: PIN_RESTITUTION, slip: PIN_SLIP },
      // A leg's top sits flush under its own slab; testing it against slabs at all would only
      // jitter it, so legs meet the floor, the wall and the cacti and nothing built.
      body.role === "leg" ? staticSegments : segments
    );

    body.x = resolved.x;
    body.y = resolved.y;
    body.previousX = resolved.previousX;
    body.previousY = resolved.previousY;
  }
};

const clampUnit = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

type StickContact = {
  /** From the body's centre toward the point on the stick it is being pushed away from. */
  readonly deltaX: number;
  readonly deltaY: number;
  readonly distance: number;
  /** How deep the body sits inside the surface, in world units. */
  readonly depth: number;
  /** Where along the stick the push lands: all to the foot at 0, all to the head at 1. */
  readonly along: number;
};

const resolveStickContact = (
  body: Body,
  foot: Body,
  head: Body
): StickContact | null => {
  const shaftX = head.x - foot.x;
  const shaftY = head.y - foot.y;
  const shaftLengthSquared = shaftX * shaftX + shaftY * shaftY;

  if (shaftLengthSquared === 0) {
    return null;
  }

  const along = clampUnit(
    ((body.x - foot.x) * shaftX + (body.y - foot.y) * shaftY) / shaftLengthSquared
  );
  const deltaX = foot.x + shaftX * along - body.x;
  const deltaY = foot.y + shaftY * along - body.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const minimum = body.radius + foot.radius + (head.radius - foot.radius) * along;

  if (distance >= minimum || distance === 0) {
    return null;
  }

  return { deltaX, deltaY, distance, depth: minimum - distance, along };
};

const applyStickContact = (
  body: Body,
  foot: Body,
  head: Body,
  contact: StickContact,
  bodyShare: number
): void => {
  const push = contact.depth / contact.distance;
  const pinShare = push * (1 - bodyShare);

  body.x -= contact.deltaX * push * bodyShare;
  body.y -= contact.deltaY * push * bodyShare;
  foot.x += contact.deltaX * pinShare * (1 - contact.along);
  foot.y += contact.deltaY * pinShare * (1 - contact.along);
  head.x += contact.deltaX * pinShare * contact.along;
  head.y += contact.deltaY * pinShare * contact.along;
};

/**
 * One circular body against one stick — a pin or a leg — treated as the capsule it is drawn as
 * rather than as its two endpoints. A two-body pin has a bird-sized hole between foot and head,
 * and a flat shot sails clean through it; closing that hole is what makes the rack hittable at all.
 *
 * The push lands where the contact is: a blow near the head puts almost all of itself into the
 * head and almost none into the foot, which is exactly the torque that puts a pin over. Positions
 * move and the previous ones do not, which in Verlet IS the transfer of momentum.
 *
 * `bodyShare` is how much of the separation the circle absorbs — the mass ratio, in effect. A pin
 * is light next to the flying schlong, so the shot keeps its legs and ploughs on down the rack
 * instead of stopping dead in the first player it meets.
 */
const collideCircleWithStick = (
  body: Body,
  foot: Body,
  head: Body,
  bodyShare: number
): void => {
  const contact = resolveStickContact(body, foot, head);

  if (contact !== null) {
    applyStickContact(body, foot, head, contact, bodyShare);
  }
};

/**
 * One circular body against a circle carried rigidly on a stick: `along` of the way from foot to
 * head and `side` units off it, toward the slingshot. This is how the FACE and the CHEST are hit —
 * the parts of the bird the room sees that the capsule does not cover (`JOUST_PIN_HEAD_FORWARD`,
 * `JOUST_PIN_CHEST`). The push lands on the two bodies by `along`, exactly as a stick contact
 * does, so a blow to the face is a blow to the head and torques the pin over about its foot.
 */
const resolveCarriedContact = (
  body: Body,
  foot: Body,
  head: Body,
  along: number,
  side: number,
  radius: number
): StickContact | null => {
  const shaftX = head.x - foot.x;
  const shaftY = head.y - foot.y;
  const shaftLength = Math.sqrt(shaftX * shaftX + shaftY * shaftY);

  if (shaftLength === 0) {
    return null;
  }

  // Perpendicular to the stick, on the side the slingshot is for an upright pin.
  const sideX = shaftY / shaftLength;
  const sideY = -shaftX / shaftLength;
  const deltaX = foot.x + shaftX * along + sideX * side - body.x;
  const deltaY = foot.y + shaftY * along + sideY * side - body.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const minimum = body.radius + radius;

  if (distance >= minimum || distance === 0) {
    return null;
  }

  return { deltaX, deltaY, distance, depth: minimum - distance, along };
};

const CHEST_ALONG = JOUST_PIN_CHEST.up / JOUST_PIN_HEIGHT;

/**
 * The lowest a shot's blow is treated as landing, as a fraction of the bird's height. A bird is a
 * lever on planted feet: a blow at the chest swings the head over by more than the blow itself,
 * and a blow at the ankles would swing it by a silly multiple, so it is read as a shin hit.
 */
const BIRD_LEVER_FLOOR = 0.4;
/**
 * How much of its usual share the shot still pays against a bird that is already going over, as a
 * fraction. At 1 a Log ploughing a row stalled in the third bird and came off the fourth
 * backwards, kicked by felled heads swinging round onto its shaft; at 0 it bulldozed every row it
 * met, the Standard cleared a twelve-rack on one pull in twenty and folded towers nearly as often
 * as the Log. Halfway keeps both the plough and the Log's reason to exist.
 */
const FELLED_BIRD_SHARE = 0.5;

/**
 * One shooter body against one BIRD: the stick, the face and the chest as a single solid, resolved
 * by whichever of the three it is deepest inside, and resolved as a LEVER. The bird's feet are
 * planted — the shot never shoves them — and the whole of the bird's share swings the head over
 * about them, scaled up by how low the blow landed so the contact itself clears in the one step.
 * A chest hit therefore rotates the bird over rather than sliding it, which is both what a bird
 * does and what keeps the row from being a wall: splitting the push to the foot the way the rack
 * does among itself put most of a chest hit into a foot that is sprung to its spot, the contact
 * never cleared, and a Log that should plough a row came off it backwards at highway speed.
 */
const collideCircleWithBird = (
  body: Body,
  foot: Body,
  head: Body,
  bodyShare: number
): void => {
  let deepest = resolveStickContact(body, foot, head);

  for (const candidate of [
    resolveCarriedContact(body, foot, head, 1, JOUST_PIN_HEAD_FORWARD, JOUST_PIN_HEAD_RADIUS),
    resolveCarriedContact(
      body,
      foot,
      head,
      CHEST_ALONG,
      JOUST_PIN_CHEST.forward,
      JOUST_PIN_CHEST.radius
    )
  ]) {
    if (candidate !== null && (deepest === null || candidate.depth > deepest.depth)) {
      deepest = candidate;
    }
  }

  if (deepest === null) {
    return;
  }

  const push = deepest.depth / deepest.distance;
  const lever = 1 / Math.max(BIRD_LEVER_FLOOR, deepest.along);

  body.x -= deepest.deltaX * push * bodyShare;
  body.y -= deepest.deltaY * push * bodyShare;
  head.x += deepest.deltaX * push * (1 - bodyShare) * lever;
  head.y += deepest.deltaY * push * (1 - bodyShare) * lever;
};

/**
 * The shot against the rack — the stick, then the face and the chest the bird wears on it — then
 * the rack against itself, so a pin going over takes its neighbours with it and the lane goes down
 * like bowling. Birds meet each other as sticks only: their faces and chests already overlap at
 * `JOUST_PIN_SPACING`, and a rack that shoves itself over before the shot is not a rack. A pin is
 * never tested against its own shaft; its two halves are held by their stick.
 */
const collideRack = (
  bodies: Body[],
  pins: readonly Pin[],
  legs: readonly Leg[],
  shooterMassShare: number
): void => {
  for (const pin of pins) {
    const foot = bodies[pin.footIndex];
    const head = bodies[pin.headIndex];

    if (foot === undefined || head === undefined) {
      continue;
    }

    // A bird already going over is out of the shot's way: it costs the shot nothing more, and is
    // shoved aside whole. The shot pays for every bird it knocks down exactly once, on the contact
    // that knocks it — not again on every frame of the fall, and not when a felled head swinging
    // round lands on the shaft behind it. Without this a Log that should plough a row stalled in
    // the third bird it met and came off the fourth backwards.
    const bodyShare =
      pin.falling || pin.toppled ? shooterMassShare * FELLED_BIRD_SHARE : shooterMassShare;

    for (let bodyIndex = 0; bodyIndex < JOUST_SHOOTER_BODY_COUNT; bodyIndex += 1) {
      const shooterBody = bodies[bodyIndex];

      if (shooterBody !== undefined) {
        collideCircleWithBird(shooterBody, foot, head, bodyShare);
      }
    }

    for (const neighbour of pins) {
      const neighbourFoot = bodies[neighbour.footIndex];
      const neighbourHead = bodies[neighbour.headIndex];

      if (neighbour === pin || neighbourFoot === undefined || neighbourHead === undefined) {
        continue;
      }

      collideCircleWithStick(head, neighbourFoot, neighbourHead, 0.5);
      collideCircleWithStick(foot, neighbourFoot, neighbourHead, 0.5);
    }

    // Birds against timber: a pin bounces off a standing leg, and a folding tower's frame sweeps
    // whoever is stood beneath it — which is what makes bringing one down worth the shot.
    for (const leg of legs) {
      const legFoot = bodies[leg.footIndex];
      const legTop = bodies[leg.topIndex];

      if (legFoot === undefined || legTop === undefined) {
        continue;
      }

      collideCircleWithStick(head, legFoot, legTop, PIN_LEG_SHARE);
      collideCircleWithStick(foot, legFoot, legTop, PIN_LEG_SHARE);
    }
  }
};

/** The shot against the towers: the contact that can fold a leg, if there is enough behind it. */
const collideTowers = (bodies: Body[], legs: readonly Leg[], shooterLegShare: number): void => {
  for (const leg of legs) {
    const foot = bodies[leg.footIndex];
    const top = bodies[leg.topIndex];

    if (foot === undefined || top === undefined) {
      continue;
    }

    for (let bodyIndex = 0; bodyIndex < JOUST_SHOOTER_BODY_COUNT; bodyIndex += 1) {
      const shooterBody = bodies[bodyIndex];

      if (shooterBody !== undefined) {
        collideCircleWithStick(shooterBody, foot, top, shooterLegShare);
      }
    }
  }
};

const maxDisplacement = (before: JoustFrame, after: JoustFrame, fromBodyIndex: number): number => {
  let largest = 0;

  for (let index = fromBodyIndex * 2; index + 1 < after.length; index += 2) {
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

const toStaticSegments = (arena: JoustArena): Segment[] => {
  return resolveJoustStaticSegments(arena).map((segment, index) => ({
    id: `segment-${index}`,
    from: segment.from,
    to: segment.to
  }));
};

/** The static geometry plus the slab of every tower still on its legs. */
const toActiveSegments = (staticSegments: readonly Segment[], towers: readonly Tower[]): Segment[] => {
  return [
    ...staticSegments,
    ...towers.flatMap((tower) => (tower.collapsed ? [] : tower.slabSegments))
  ];
};

/**
 * Fires one shot and returns the keyframe track a display would replay, plus every pin it put on
 * the sand and the frame each one went down on.
 *
 * Pure and dependency-free by construction: same lane + same aim + same seed ⇒ the same track,
 * every time. The track is cut as soon as the scene has settled or the shooter has left the world
 * with the rack quiet, so a clean miss into the void and a nine-pin pile-up both end near the
 * moment the room stops caring.
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

  const profile = options.shooter ?? JOUST_STANDARD_SHOOTER_PROFILE;
  const pinCount = arena.pinFeet.length;
  const { towers, legs } = buildTowers(arena, pinCount);
  const rest = resolveJoustRestPositions(arena, clampedAim, profile);
  const bodies = buildBodies(
    rest,
    pinCount,
    legs.length,
    resolveJoustLaunchVelocity(clampedAim, profile),
    stepSeconds,
    options.seed,
    profile
  );
  const pins = buildPins(arena);
  const constraints = buildConstraints(rest, pins, legs, towers, profile);
  const staticSegments = toStaticSegments(arena);
  let segments = toActiveSegments(staticSegments, towers);

  const keyframes: JoustFrame[] = [toJoustFrame(bodies)];
  const topples: JoustTopple[] = [];
  const collapses: JoustCollapse[] = [];
  let stillFrames = 0;
  let quietRackFrames = 0;

  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
    integrate(bodies, gravityStep, profile.damping);

    for (let iteration = 0; iteration < CONSTRAINT_ITERATIONS; iteration += 1) {
      relax(bodies, constraints);
    }

    settlePins(bodies, pins);
    settleLegs(bodies, legs, towers);

    collideWithSegments(bodies, segments, staticSegments, profile);
    collideTowers(bodies, legs, profile.legShare);
    collideRack(bodies, pins, legs, profile.massShare);
    latchTopples(bodies, pins, constraints, keyframes.length, topples);

    if (
      latchCollapses(bodies, towers, legs, pins, constraints, keyframes.length, collapses, topples)
    ) {
      segments = toActiveSegments(staticSegments, towers);
    }

    if (stepIndex % stepsPerKeyframe !== 0) {
      continue;
    }

    const frame = toJoustFrame(bodies);
    const previous = keyframes[keyframes.length - 1];

    keyframes.push(frame);

    if (previous === undefined) {
      continue;
    }

    stillFrames =
      maxDisplacement(previous, frame, 0) <= SETTLE_EPSILON_UNITS ? stillFrames + 1 : 0;
    // Measured over the rack alone, because a shooter tumbling out of the world never stops
    // moving and would otherwise hold a finished scene open to the cap.
    quietRackFrames =
      maxDisplacement(previous, frame, JOUST_SHOOTER_BODY_COUNT) <= SETTLE_EPSILON_UNITS
        ? quietRackFrames + 1
        : 0;

    const isSceneOver =
      stillFrames >= SETTLE_FRAMES ||
      (isShooterGone(bodies) && quietRackFrames >= SETTLE_FRAMES);

    if (stepIndex >= minSteps && isSceneOver) {
      break;
    }
  }

  const lastFrameIndex = keyframes.length - 1;

  return {
    keyframeHz: options.keyframeHz,
    keyframes,
    topples: topples.map((topple) => ({
      pinIndex: topple.pinIndex,
      frameIndex: Math.min(topple.frameIndex, lastFrameIndex)
    })),
    collapses: collapses.map((collapse) => ({
      perchIndex: collapse.perchIndex,
      frameIndex: Math.min(collapse.frameIndex, lastFrameIndex)
    }))
  };
};
