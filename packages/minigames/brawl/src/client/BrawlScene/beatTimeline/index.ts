import type { HenPose } from "../henPose/index.js";

/**
 * The three endings a block plays over its last frame, `progress` 0 → 1, as pure numbers the
 * scene paints (docs/minigames/brawl-spec.md §0.7). Every one ends on the hen, never a hard cut.
 */

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Ease in and out: a share of a move, smoothed at both ends. */
export const smooth = (share: number): number => {
  const clamped = clamp01(share);

  return clamped * clamped * (3 - 2 * clamped);
};

const lerp = (from: number, to: number, share: number): number => from + (to - from) * share;

export type ClearedBeat = {
  henX: number;
  facing: -1 | 1;
  pose: HenPose;
  /** Which way the waiting teammate faces: back at the hen, then down the street when they take over. */
  mateFacing: -1 | 1;
};

/** How far short of the waiting teammate the hen stops: beak to beak, not in one another. */
export const HANDOFF_GAP = 16;
const WALK_UNTIL = 0.45;
const HIGH_FIVE_UNTIL = 0.7;

/**
 * The handoff: the hen walks up to the teammate waiting past the chalk line, they peck beak to
 * beak — the high five — and the teammate turns to face the street while the hen turns back to
 * the one she came down. With nobody waiting (the last block) she steps over the line and takes
 * a bow.
 */
export const resolveClearedBeat = (henX: number, mateX: number | null, progress: number): ClearedBeat => {
  const target = mateX === null ? henX + 6 : Math.max(henX, mateX - HANDOFF_GAP);

  if (progress < WALK_UNTIL) {
    const walked = lerp(henX, target, smooth(progress / WALK_UNTIL));

    return { henX: walked, facing: 1, pose: target - henX > 0.5 ? "walk" : "idle", mateFacing: -1 };
  }

  if (progress < HIGH_FIVE_UNTIL) {
    return { henX: target, facing: 1, pose: "peck", mateFacing: -1 };
  }

  return { henX: target, facing: mateX === null ? 1 : -1, pose: "idle", mateFacing: 1 };
};

export type GooseHold = { x: number; y: number; facing: -1 | 1 };

export type KoBeat = {
  /** How far up off the ground the geese have carried her. */
  henLift: number;
  /** The geese, as foot points in world units (y up off the ground), or none before they arrive. */
  geese: GooseHold[];
  /** How far through the splash the bay is, 0 → 1, or null before she lands in it. */
  splash: number | null;
};

const GRAB_AT = 0.25;
const LIFT_UNTIL = 0.72;
/** Far enough to carry her off the top of any camera: past the box and the TV's spare sky. */
const LIFT_HEIGHT = 120;
/** Where the geese come from, above the frame and out to the sides. */
const SWOOP_FROM_UP = 90;
const SWOOP_FROM_SIDE = 30;
/** Where each goose holds on, off the hen's foot point: two at her sides, one over her. */
const HOLDS: readonly GooseHold[] = [
  { x: -8, y: 13, facing: 1 },
  { x: 8, y: 15, facing: -1 },
  { x: 1, y: 21, facing: 1 }
];

/**
 * The bay: out of hearts, the hen goes down on her back; three geese swoop in, take hold, and
 * carry her up off the top of the frame, and then Kempenfelt Bay splashes at the bottom of it.
 */
export const resolveKoBeat = (henX: number, progress: number): KoBeat => {
  const swoop = smooth(progress / GRAB_AT);
  const henLift = progress < GRAB_AT ? 0 : smooth((progress - GRAB_AT) / (LIFT_UNTIL - GRAB_AT)) * LIFT_HEIGHT;
  const geese = HOLDS.map((hold) => ({
    x: henX + hold.x - hold.facing * (1 - swoop) * SWOOP_FROM_SIDE,
    y: hold.y + henLift + (1 - swoop) * SWOOP_FROM_UP,
    facing: hold.facing
  }));

  return {
    henLift,
    geese,
    splash: progress < LIFT_UNTIL ? null : clamp01((progress - LIFT_UNTIL) / (1 - LIFT_UNTIL))
  };
};

export type TimeoutBeat = { tilt: number; pose: HenPose };

/** The bell: the hen reels, then slumps forward over her feet while it rings out. */
export const resolveTimeoutBeat = (facing: -1 | 1, progress: number): TimeoutBeat => {
  return { tilt: facing * 14 * smooth(progress / 0.4), pose: "hurt" };
};
