import type { BrawlGoonState } from "@wingnight/shared";

/**
 * How the goose's parts sit in one state, in its own drawing units (feet on the origin, facing
 * right, y up the screen negative). The goose is a little rig like the cast hen: the body tilts
 * about the feet, the neck reaches from its base at an angle off straight up and a length, the
 * head turns on the end of it, the bill gapes, the wing lifts off the back, and the two feet are
 * placed rather than swung, so a walk is two frames of feet and nothing ever needs a loop.
 */
export type GoosePose = {
  /** The whole body about the feet, degrees; positive tips it forward onto its bill. */
  tilt: number;
  /** The neck off straight up, degrees (positive forward), and how far it reaches. */
  neck: number;
  reach: number;
  /** The head's own turn, degrees; positive points the bill down. */
  bill: number;
  /** How far the bill is open, degrees. */
  gape: number;
  /** The wing off the back, degrees; nought leaves it folded. */
  wing: number;
  /** Where each foot is planted, in drawing units: x along the street, y off the ground. */
  near: { x: number; y: number };
  far: { x: number; y: number };
  eye: "open" | "shut" | "out";
  /** Flat on its back, feet in the air: the whole goose rolled over onto the street. */
  onBack: boolean;
};

const STAND = { tilt: 0, neck: 19, reach: 5.2, bill: 0, gape: 0, wing: 0, eye: "open", onBack: false } as const;

/** The two walk frames: the near foot forward and the far one back, then the swap. */
const STRIDES: [Pick<GoosePose, "near" | "far" | "neck">, Pick<GoosePose, "near" | "far" | "neck">] = [
  { near: { x: 1.5, y: 0 }, far: { x: -1.1, y: 0 }, neck: 17 },
  { near: { x: -0.9, y: 0 }, far: { x: 1.3, y: -0.6 }, neck: 25 }
];

const POSES: Record<Exclude<BrawlGoonState, "entering" | "approach" | "gone">, GoosePose> = {
  // The honk: drawn up to its full height, rocked back, bill to the sky and wide open, wings
  // half out. The longest the neck ever is, so it reads from the sofa before the lines do.
  telegraph: {
    ...STAND,
    tilt: -6,
    neck: -4,
    reach: 6.8,
    bill: -32,
    gape: 24,
    wing: 38,
    near: { x: 1.5, y: 0 },
    far: { x: -1.3, y: 0 }
  },
  // The lunge: everything forward and low, neck out flat at the hen's chest, wings spread,
  // the back leg driving.
  attack: {
    ...STAND,
    tilt: 16,
    neck: 80,
    reach: 6.2,
    bill: 14,
    gape: 14,
    wing: 58,
    near: { x: 2.4, y: 0 },
    far: { x: -2.6, y: 0 }
  },
  // Spent: slumped forward with the head hanging and the eye half shut.
  recover: {
    ...STAND,
    tilt: 8,
    neck: 118,
    reach: 4.2,
    bill: 66,
    eye: "shut",
    near: { x: 0.9, y: 0 },
    far: { x: -0.8, y: 0 }
  },
  // Pecked and still up: reeling back, head thrown back, bill open, wings flung, legs splayed.
  stunned: {
    ...STAND,
    tilt: -16,
    neck: -40,
    reach: 4.8,
    bill: -48,
    gape: 26,
    wing: 84,
    near: { x: 2.6, y: -0.5 },
    far: { x: -2.3, y: 0 }
  },
  // Out: on its back, the neck laid flat out along the street, the bill hanging open, feet up.
  ko: {
    ...STAND,
    neck: 92,
    reach: 4.6,
    bill: 8,
    gape: 20,
    eye: "out",
    near: { x: 1.9, y: 0 },
    far: { x: -1.5, y: 0 },
    onBack: true
  }
};

/** The goose's pose for a state and, while it walks, the walk frame. `gone` draws nothing. */
export const resolveGoosePose = (state: BrawlGoonState, frame: 0 | 1): GoosePose | null => {
  if (state === "gone") {
    return null;
  }

  if (state === "entering" || state === "approach") {
    return { ...STAND, ...STRIDES[frame] };
  }

  return POSES[state];
};
