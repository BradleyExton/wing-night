import type { BrawlGoonState } from "@wingnight/shared";

import type { GoosePose } from "../../GooseFigure/pose/index.js";

/**
 * The helmet goose's pose: the goose's own rig (`../../GooseFigure/pose`) with one more dial, the
 * cage. The whole drawing turns on two modes the room must tell apart from a couch
 * (docs/research/brawl-depth-and-strategy.md, feature 5):
 *
 *   ARMOURED — `entering`, `approach`, `stunned`: head down and driven forward like a player
 *   skating into the corner, the cage down over the bill. A peck here bounces off (a clank).
 *
 *   OPEN — `telegraph`, `attack`, `recover`: head up, the cage flipped up off the face, the bill
 *   bare. The one window a peck lands in is the one the room is already shouting about.
 *
 *   `ko`: the helmet is off, lying beside it on the street.
 */
export type HelmetPose = GoosePose & { cage: "down" | "up" | "off" };

// Head down, neck driven forward and low: the armoured walk. Further forward than the goose's
// stand, so even the silhouette says "lowered head" before the helmet reads.
const ARMOURED = {
  tilt: 4,
  neck: 58,
  reach: 5.6,
  bill: 34,
  gape: 0,
  wing: 0,
  eye: "open",
  onBack: false,
  cage: "down"
} as const;

/** The two walk frames: the near foot forward and the far one back, then the swap, the head boring on. */
const STRIDES: [Pick<HelmetPose, "near" | "far" | "neck">, Pick<HelmetPose, "near" | "far" | "neck">] = [
  { near: { x: 1.5, y: 0 }, far: { x: -1.1, y: 0 }, neck: 56 },
  { near: { x: -0.9, y: 0 }, far: { x: 1.3, y: -0.6 }, neck: 64 }
];

const POSES: Record<Exclude<BrawlGoonState, "entering" | "approach" | "stalk" | "gone">, HelmetPose> = {
  // The honk, and the guard dropped with it: drawn up to full height, bill to the sky, the cage
  // thrown up off the face. The goose's own telegraph, so the room reads it as one.
  telegraph: {
    ...ARMOURED,
    tilt: -6,
    neck: -4,
    reach: 6.8,
    bill: -32,
    gape: 24,
    wing: 38,
    cage: "up",
    near: { x: 1.5, y: 0 },
    far: { x: -1.3, y: 0 }
  },
  // The lunge, bare-faced: everything forward and low, the cage still up.
  attack: {
    ...ARMOURED,
    tilt: 16,
    neck: 80,
    reach: 6.2,
    bill: 14,
    gape: 14,
    wing: 58,
    cage: "up",
    near: { x: 2.4, y: 0 },
    far: { x: -2.6, y: 0 }
  },
  // Spent and still open: slumped, head hanging, the cage yet to come down.
  recover: {
    ...ARMOURED,
    tilt: 8,
    neck: 118,
    reach: 4.2,
    bill: 66,
    eye: "shut",
    cage: "up",
    near: { x: 0.9, y: 0 },
    far: { x: -0.8, y: 0 }
  },
  // Clanked: reeling back from the bounce, wings flung, but the head stays tucked and caged.
  stunned: {
    ...ARMOURED,
    tilt: -12,
    neck: 36,
    reach: 5.2,
    bill: 40,
    gape: 6,
    wing: 70,
    near: { x: 2.6, y: -0.5 },
    far: { x: -2.3, y: 0 }
  },
  // Out: on its back, neck along the street, the helmet knocked off beside it.
  ko: {
    ...ARMOURED,
    tilt: 0,
    neck: 92,
    reach: 4.6,
    bill: 8,
    gape: 20,
    eye: "out",
    cage: "off",
    near: { x: 1.9, y: 0 },
    far: { x: -1.5, y: 0 },
    onBack: true
  }
};

/** The helmet goose's pose for a state and, while it walks, the walk frame. `gone` draws nothing. */
export const resolveHelmetPose = (state: BrawlGoonState, frame: 0 | 1): HelmetPose | null => {
  if (state === "gone") {
    return null;
  }

  if (state === "entering" || state === "approach" || state === "stalk") {
    return { ...ARMOURED, ...STRIDES[frame] };
  }

  return POSES[state];
};

/** Whether a pose is armoured — the mode a peck bounces off — rather than open. */
export const isArmouredPose = (pose: HelmetPose): boolean => pose.cage === "down";
