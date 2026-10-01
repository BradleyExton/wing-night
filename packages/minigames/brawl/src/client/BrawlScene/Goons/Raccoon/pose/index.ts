import type { BrawlGoonState } from "@wingnight/shared";

import type { Point } from "../../rig/index.js";

/**
 * How the raccoon's parts sit in one state, in its own drawing units (feet on the origin, facing
 * right). The body tilts about its hips and sinks by `drop`; each of the four feet is planted
 * rather than swung, so a trot is two frames of diagonal pairs; the head turns on the shoulders
 * and the tail is a curve from its root to `tail`.
 */
export type RaccoonPose = {
  /** The body about the hips, degrees; positive puts the head down and the rump up. */
  tilt: number;
  /** How far the body sinks toward the street, in drawing units (a crouch is a drop). */
  drop: number;
  head: number;
  mouth: boolean;
  backNear: Point;
  backFar: Point;
  frontNear: Point;
  frontFar: Point;
  /** Where the tail's tip is, before the tilt. */
  tail: Point;
  eye: "open" | "shut" | "out";
  onBack: boolean;
};

const STAND = { tilt: 0, drop: 0, head: 0, mouth: false, eye: "open", onBack: false } as const;

const TROT: [RaccoonPose, RaccoonPose] = [
  {
    ...STAND,
    backNear: { x: -1.2, y: 0 },
    backFar: { x: -3, y: 0 },
    frontNear: { x: 2.9, y: 0 },
    frontFar: { x: 1.1, y: 0 },
    tail: { x: -6, y: -8.2 }
  },
  {
    ...STAND,
    backNear: { x: -3, y: 0 },
    backFar: { x: -1.3, y: -0.5 },
    frontNear: { x: 1.1, y: -0.5 },
    frontFar: { x: 2.9, y: 0 },
    tail: { x: -6.6, y: -7.6 }
  }
];

const POSES: Record<Exclude<BrawlGoonState, "entering" | "approach" | "gone">, RaccoonPose> = {
  // The crouch before the charge: chest to the street, rump up, the tail bolt upright and the
  // feet spread wide for the push.
  telegraph: {
    ...STAND,
    tilt: 10,
    drop: 1.1,
    head: -6,
    backNear: { x: -2.2, y: 0 },
    backFar: { x: -3.4, y: 0 },
    frontNear: { x: 3.6, y: 0 },
    frontFar: { x: 2.6, y: 0 },
    tail: { x: -3.6, y: -9.4 }
  },
  // The charge: stretched out flat in a gallop, jaws open, the tail streaming behind.
  attack: {
    ...STAND,
    tilt: 2,
    drop: 0.5,
    head: 8,
    mouth: true,
    backNear: { x: -4.6, y: -0.4 },
    backFar: { x: -3.6, y: 0 },
    frontNear: { x: 4.4, y: -0.6 },
    frontFar: { x: 3.4, y: 0 },
    tail: { x: -7.6, y: -4.6 }
  },
  // Winded: sat back on its haunches, head down, tail in the gutter.
  recover: {
    ...STAND,
    tilt: -16,
    drop: 0.6,
    head: 22,
    eye: "shut",
    backNear: { x: -1.6, y: 0 },
    backFar: { x: -2.6, y: 0 },
    frontNear: { x: 2.2, y: 0 },
    frontFar: { x: 1.4, y: 0 },
    tail: { x: -6.8, y: -1.2 }
  },
  // Pecked: reared up on its hind legs, front paws up, head thrown back.
  stunned: {
    ...STAND,
    tilt: -34,
    head: -26,
    mouth: true,
    backNear: { x: -1.4, y: 0 },
    backFar: { x: -2.6, y: 0 },
    frontNear: { x: 3, y: -4.8 },
    frontFar: { x: 2, y: -5.6 },
    tail: { x: -6.4, y: -2.6 }
  },
  // Out: on its back, all four feet in the air, the tail flat out along the street.
  ko: {
    ...STAND,
    head: 12,
    mouth: true,
    eye: "out",
    backNear: { x: -1.6, y: 0.4 },
    backFar: { x: -3.2, y: 0 },
    frontNear: { x: 2.6, y: 0.4 },
    frontFar: { x: 1.2, y: 0 },
    tail: { x: -6.8, y: -4.4 },
    onBack: true
  }
};

/** The raccoon's pose for a state and, while it trots, the trot frame. `gone` draws nothing. */
export const resolveRaccoonPose = (state: BrawlGoonState, frame: 0 | 1): RaccoonPose | null => {
  if (state === "gone") {
    return null;
  }

  return state === "entering" || state === "approach" ? TROT[frame] : POSES[state];
};
