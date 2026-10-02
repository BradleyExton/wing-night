import type { MountLimb, MountParticle, MountPose, MountShape, MountSurfaceRef, MountVec } from "../types.js";
import { MOUNT_PARTICLES, MOUNT_WORLD } from "../world/index.js";

// The hen's derived geometry: everything the sim and the pile both need to know about where a
// part of the bird is, given only its nine particles. No angles anywhere. A fixed point of the
// torso is an affine combination of three torso particles (its barycentric weights at rest), so
// it rides the torso exactly while the torso is rigid; a fixed point of the head is placed in the
// head bone's own frame (origin the neck, x toward the beak, y its perpendicular).

/** A point carried by particles: `[particle index, weight]` pairs whose weights sum to 1. */
export type MountWeights = readonly (readonly [number, number])[];

export const PARTICLE_INDEX: Record<MountParticle, number> = {
  rump: 0,
  neck: 1,
  hipLeft: 2,
  hipRight: 3,
  footLeft: 4,
  footRight: 5,
  wing: 6,
  beak: 7,
  wingFar: 8
};

export const PARTICLE_COUNT = MOUNT_PARTICLES.length;

const { rest, rig } = { rest: MOUNT_WORLD.rig.rest, rig: MOUNT_WORLD.rig };

// The torso triangle the fixed points hang from: rump, neck and the far hip, the widest of the
// four triangles the torso's particles make, so the weights are well conditioned.
const TRIANGLE = [PARTICLE_INDEX.rump, PARTICLE_INDEX.neck, PARTICLE_INDEX.hipRight] as const;

const torsoWeights = (point: MountVec): MountWeights => {
  const origin = rest.rump;
  const ax = rest.neck.x - origin.x;
  const ay = rest.neck.y - origin.y;
  const bx = rest.hipRight.x - origin.x;
  const by = rest.hipRight.y - origin.y;
  const px = point.x - origin.x;
  const py = point.y - origin.y;
  const det = ax * by - ay * bx;
  const alpha = (px * by - py * bx) / det;
  const beta = (ax * py - ay * px) / det;

  return [
    [TRIANGLE[0], 1 - alpha - beta],
    [TRIANGLE[1], alpha],
    [TRIANGLE[2], beta]
  ];
};

export const BODY_JOINT_WEIGHTS = torsoWeights(rig.bodyJoint);
export const WING_ROOT_WEIGHTS = torsoWeights(rig.wingRoot);
export const WING_FAR_ROOT_WEIGHTS = torsoWeights(rig.wingFarRoot);
export const BODY_CENTRE_WEIGHTS = torsoWeights(rig.body.c);

/** A point in the head bone's frame: `along` toward the beak, `across` its perpendicular (−dy, dx). */
type HeadLocal = { along: number; across: number };

const headLocal = (point: MountVec): HeadLocal => {
  const dx = rest.beak.x - rest.neck.x;
  const dy = rest.beak.y - rest.neck.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length;
  const uy = dy / length;
  const px = point.x - rest.neck.x;
  const py = point.y - rest.neck.y;

  return { along: px * ux + py * uy, across: px * -uy + py * ux };
};

const HEAD_CENTRE_LOCAL = headLocal(rig.head.c);
const CROWN_LOCAL = headLocal(rig.crown);

/**
 * How a push on the head ball is shared between the neck and the beak: by where the ball's centre
 * falls along the bone. The ball sits off the bone's line, so this leaves out the turn a push
 * would give the head; the bone and the limits take that up on the next pass.
 */
const HEAD_SHARE = HEAD_CENTRE_LOCAL.along / rig.bone.beak;
export const HEAD_WEIGHTS: MountWeights = [
  [PARTICLE_INDEX.neck, 1 - HEAD_SHARE],
  [PARTICLE_INDEX.beak, HEAD_SHARE]
];

/** The share of the near wing's bone its capsule covers: it stops a radius short, so its cap ends at the tip. */
export const WING_CAPSULE_SHARE = (rig.bone.wing - rig.radius.wing) / rig.bone.wing;

export type Points = { x: Float64Array; y: Float64Array };

export const placeWeighted = (points: Points, weights: MountWeights): MountVec => {
  let x = 0;
  let y = 0;

  // An index loop rather than for-of: this is the sim's hottest line, and the order of the sum
  // is the same either way.
  for (let at = 0; at < weights.length; at += 1) {
    const pair = weights[at] ?? EMPTY_PAIR;
    x += (points.x[pair[0]] ?? 0) * pair[1];
    y += (points.y[pair[0]] ?? 0) * pair[1];
  }

  return { x, y };
};

const EMPTY_PAIR = [0, 0] as const;

const placeHead = (neck: MountVec, beak: MountVec, local: HeadLocal): MountVec => {
  const dx = beak.x - neck.x;
  const dy = beak.y - neck.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = length > 0 ? dx / length : 1;
  const uy = length > 0 ? dy / length : 0;

  return {
    x: neck.x + local.along * ux - local.across * uy,
    y: neck.y + local.along * uy + local.across * ux
  };
};

export const placeHeadCentre = (neck: MountVec, beak: MountVec): MountVec => placeHead(neck, beak, HEAD_CENTRE_LOCAL);
export const placeCrown = (neck: MountVec, beak: MountVec): MountVec => placeHead(neck, beak, CROWN_LOCAL);

/** Where each limb's bone hangs from: a particle for the legs and the head, a torso point for the wings. */
export const LIMB_JOINT_WEIGHTS: Record<MountLimb | "wingFar", MountWeights> = {
  footLeft: [[PARTICLE_INDEX.hipLeft, 1]],
  footRight: [[PARTICLE_INDEX.hipRight, 1]],
  wing: WING_ROOT_WEIGHTS,
  beak: [[PARTICLE_INDEX.neck, 1]],
  wingFar: WING_FAR_ROOT_WEIGHTS
};

export const toPoints = (pose: MountPose): Points => {
  const x = new Float64Array(PARTICLE_COUNT);
  const y = new Float64Array(PARTICLE_COUNT);

  for (const particle of MOUNT_PARTICLES) {
    const index = PARTICLE_INDEX[particle];
    x[index] = pose[particle].x;
    y[index] = pose[particle].y;
  }

  return { x, y };
};

export const toPose = (points: Points): MountPose => {
  const read = (particle: MountParticle): MountVec => {
    const index = PARTICLE_INDEX[particle];

    return { x: points.x[index], y: points.y[index] };
  };

  return {
    rump: read("rump"),
    neck: read("neck"),
    hipLeft: read("hipLeft"),
    hipRight: read("hipRight"),
    footLeft: read("footLeft"),
    footRight: read("footRight"),
    wing: read("wing"),
    beak: read("beak"),
    wingFar: read("wingFar")
  };
};

const weighted = (pose: MountPose, weights: MountWeights): MountVec => placeWeighted(toPoints(pose), weights);

/** A pose's colliders as static shapes, each at least `minStaticRadius` thick: body, head, legs, near wing. */
export const resolvePoseShapes = (pose: MountPose, surface: MountSurfaceRef): MountShape[] => {
  const thick = (r: number): number => Math.max(r, MOUNT_WORLD.minStaticRadius);
  const wingRoot = weighted(pose, WING_ROOT_WEIGHTS);
  const wingEnd = {
    x: wingRoot.x + (pose.wing.x - wingRoot.x) * WING_CAPSULE_SHARE,
    y: wingRoot.y + (pose.wing.y - wingRoot.y) * WING_CAPSULE_SHARE
  };

  return [
    { kind: "circle", c: weighted(pose, BODY_CENTRE_WEIGHTS), r: thick(rig.body.r), surface },
    { kind: "circle", c: placeHeadCentre(pose.neck, pose.beak), r: thick(rig.head.r), surface },
    { kind: "capsule", a: pose.hipLeft, b: pose.footLeft, r: thick(rig.radius.footLeft), surface },
    { kind: "capsule", a: pose.hipRight, b: pose.footRight, r: thick(rig.radius.footRight), surface },
    { kind: "capsule", a: wingRoot, b: wingEnd, r: thick(rig.radius.wing), surface }
  ];
};
