import type { BrawlGoonState } from "@wingnight/shared";

import type { Point } from "../../rig/index.js";

/**
 * The swan's states: the shared goon script, `stalk` included. `stalk` is the swan faced by the
 * hen — it has come up on her and she has turned to it, so it stalls at its reach instead of
 * lunging (docs/research/brawl-depth-and-strategy.md, feature 4); only the swan is ever in it.
 */
export type SwanState = BrawlGoonState;

/** One segment of the neck: its angle off straight up (positive forward), its length, and how far its middle bows — positive bulges backward. */
export type NeckSegment = { degrees: number; length: number; bow: number };

/**
 * How the swan's parts sit in one state, in its own drawing units (feet on the origin, facing
 * right, y up the screen negative). Like the goose it is a rig: the body tilts about the feet,
 * the neck is TWO segments so it can hold an S, the head turns on the end of it, the bill gapes,
 * the folded wings lift off the back as one, and the feet are placed rather than swung.
 */
export type SwanPose = {
  /** The whole body about the feet, degrees; positive tips it forward onto its breast. */
  tilt: number;
  /** The lower neck, out of the breast, and the upper neck, carrying the head. */
  lower: NeckSegment;
  upper: NeckSegment;
  /** The head's own turn, degrees; positive points the bill down. */
  bill: number;
  /** How far the bill is open, degrees. */
  gape: number;
  /** The wings off the back, degrees; nought leaves them folded in their arch. */
  wing: number;
  near: Point;
  far: Point;
  /** Open; narrowed to a slit under a lid (the stalk's wary eye); shut; crossed out. */
  eye: "open" | "wary" | "shut" | "out";
  /** A knitted brow over the eye: the hiss and the lunge. */
  brow: boolean;
  /** Flat on its back, feet in the air. */
  onBack: boolean;
};

// The resting S: the lower neck rises almost straight and bulges forward at the breast, the upper
// leans forward and bulges back, and the head tips down a little over the water it has not got.
const STAND = {
  tilt: 0,
  lower: { degrees: -8, length: 4.4, bow: -0.9 },
  upper: { degrees: 34, length: 4.2, bow: 0.9 },
  bill: 20,
  gape: 0,
  wing: 0,
  eye: "open",
  brow: false,
  onBack: false
} as const;

/** The waddle: a slow roll from foot to foot, the body rocking with it and the head nodding against it. */
const STRIDES: [Partial<SwanPose>, Partial<SwanPose>] = [
  { tilt: 2, near: { x: 1.8, y: 0 }, far: { x: -1.4, y: 0 }, upper: { degrees: 30, length: 4.2, bow: 0.9 } },
  { tilt: -2, near: { x: -1.2, y: 0 }, far: { x: 1.6, y: -0.5 }, upper: { degrees: 40, length: 4.2, bow: 0.9 } }
];

const POSES: Record<Exclude<SwanState, "entering" | "approach" | "gone">, SwanPose> = {
  // Faced, and stalled: drawn up to its full height with the neck a straight column, wings tight
  // to the body, the trailing foot caught mid-step behind the tail and held there, the eye
  // narrowed on her. Nothing throbs: the stillness is the tell.
  stalk: {
    ...STAND,
    tilt: -3,
    lower: { degrees: -2, length: 5, bow: -0.3 },
    upper: { degrees: 6, length: 4.6, bow: 0.3 },
    bill: 14,
    eye: "wary",
    near: { x: 0.6, y: 0 },
    far: { x: -6.4, y: -1.3 }
  },
  // The hiss: the neck drawn back into a hard S with the head thrust forward and low out of it,
  // the bill wide, the wings half up off the back, the brow down. A busking swan.
  telegraph: {
    ...STAND,
    tilt: -4,
    lower: { degrees: -28, length: 4.2, bow: -0.5 },
    upper: { degrees: 66, length: 4.2, bow: 1.7 },
    bill: 24,
    gape: 26,
    wing: 34,
    brow: true,
    near: { x: 1.8, y: 0 },
    far: { x: -1.8, y: 0 }
  },
  // The lunge: the whole neck straight out at her chest, the wings right up, driving forward.
  attack: {
    ...STAND,
    tilt: 14,
    lower: { degrees: 66, length: 4.6, bow: -0.2 },
    upper: { degrees: 92, length: 4.6, bow: 0.1 },
    bill: 4,
    gape: 18,
    wing: 62,
    brow: true,
    near: { x: 3, y: 0 },
    far: { x: -3, y: 0 }
  },
  // Spent: sagging forward, the neck drooping into a hook, the eye shut, wings settling.
  recover: {
    ...STAND,
    tilt: 6,
    lower: { degrees: 30, length: 4.2, bow: -0.6 },
    upper: { degrees: 112, length: 4, bow: 0.8 },
    bill: 52,
    wing: 8,
    eye: "shut",
    near: { x: 1, y: 0 },
    far: { x: -0.8, y: 0 }
  },
  // Pecked and still up: reeling back, the neck thrown back over the body, wings flung wide.
  stunned: {
    ...STAND,
    tilt: -16,
    lower: { degrees: -44, length: 4.4, bow: 0.4 },
    upper: { degrees: -28, length: 4, bow: -0.6 },
    bill: -42,
    gape: 26,
    wing: 86,
    near: { x: 3, y: -0.6 },
    far: { x: -2.6, y: 0 }
  },
  // Out: on its back, the long neck laid out along the street, the bill hanging open, feet up.
  ko: {
    ...STAND,
    lower: { degrees: 82, length: 4.4, bow: 0.6 },
    upper: { degrees: 100, length: 4.2, bow: -0.4 },
    bill: 10,
    gape: 18,
    eye: "out",
    near: { x: 2.2, y: 0 },
    far: { x: -1.6, y: 0 },
    onBack: true
  }
};

/** The swan's pose for a state and, while it waddles, the walk frame. `gone` draws nothing. */
export const resolveSwanPose = (state: SwanState, frame: 0 | 1): SwanPose | null => {
  if (state === "gone") {
    return null;
  }

  if (state === "entering" || state === "approach") {
    return { ...STAND, near: { x: 0, y: 0 }, far: { x: 0, y: 0 }, ...STRIDES[frame] };
  }

  return POSES[state];
};
