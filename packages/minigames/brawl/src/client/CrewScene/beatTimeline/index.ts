import type { BrawlCrewHen } from "@wingnight/shared";

import type { HenPose } from "../henPose/index.js";

/**
 * The three endings a block plays over its last frame, `progress` 0 → 1, as pure numbers the
 * scene paints (docs/minigames/brawl-crew-spec.md §0.5, §0.7). The server has already scored the
 * block; these are the seconds the room needs to see how it went. Every one ends on the hens,
 * never a hard cut.
 */

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Ease in and out: a share of a move, smoothed at both ends. */
export const smooth = (share: number): number => {
  const clamped = clamp01(share);

  return clamped * clamped * (3 - 2 * clamped);
};

/** How one hen is drawn at a moment of a beat, over where the terminal frame left her. */
export type HenBeat = {
  pose: HenPose;
  facing: -1 | 1;
  /** World units along the street from where the frame has her. */
  dx: number;
  /** World units up off the street. */
  lift: number;
  /** Degrees about her foot. */
  tilt: number;
  opacity: number;
};

type BeatHen = Pick<BrawlCrewHen, "slot" | "state" | "facing">;

/** A hen the beat leaves as the frame has her: down where she fell, or sat out. */
const resolveBystander = (hen: BeatHen): HenBeat => ({
  pose: hen.state === "down" ? "ko" : "still",
  facing: hen.facing,
  dx: 0,
  lift: 0,
  tilt: 0,
  opacity: hen.state === "away" ? 0.4 : 1
});

/** How far the crew walks on past the line, how high a hop is, and how many of them. */
const CLEARED_WALK = 14;
const CLEARED_HOP = 5;
const CLEARED_HOPS = 3;
const CLEARED_WALK_UNTIL = 0.4;
/** Each hen starts a beat a little after the one before her, so a crew moves as a crew and not a machine. */
const SLOT_STAGGER = 0.05;

/**
 * Block clear: every hen still up walks on over the chalk line and then hops on the spot, beak
 * to the room — the crew's own cheer, one after another down the slots. A hen who was down at
 * the clear stays where she fell (the next block gets her up).
 */
export const resolveClearedBeat = (hen: BeatHen, progress: number): HenBeat => {
  if (hen.state !== "up") {
    return resolveBystander(hen);
  }

  const own = clamp01(progress - hen.slot * SLOT_STAGGER);

  if (own < CLEARED_WALK_UNTIL) {
    return { pose: "walk", facing: 1, dx: CLEARED_WALK * smooth(own / CLEARED_WALK_UNTIL), lift: 0, tilt: 0, opacity: 1 };
  }

  const hop = ((own - CLEARED_WALK_UNTIL) / (1 - CLEARED_WALK_UNTIL)) * CLEARED_HOPS;
  const arc = hop - Math.floor(hop);

  return { pose: "idle", facing: 1, dx: CLEARED_WALK, lift: own >= 1 ? 0 : CLEARED_HOP * 4 * arc * (1 - arc), tilt: 0, opacity: 1 };
};

export type GooseHold = { x: number; y: number; facing: -1 | 1 };

/** One downed hen's trip to the bay: how high she has been carried, and the two geese carrying her. */
export type BayBeat = {
  hen: HenBeat;
  /** The geese, as foot points off the hen's own foot (y up off the street), or none before they arrive. */
  geese: GooseHold[];
  /** How far through her splash the bay is, 0 → 1, or null before she lands in it. */
  splash: number | null;
};

const GRAB_AT = 0.22;
const LIFT_UNTIL = 0.68;
/** Far enough to carry her off the top of any window: past the box and a tablet's spare sky. */
const LIFT_HEIGHT = 150;
/** Where the geese come from, above the frame and out to the sides. */
const SWOOP_FROM_UP = 100;
const SWOOP_FROM_SIDE = 34;
/** Where each goose holds on, off the hen's foot point: one at each side of her. */
const HOLDS: readonly GooseHold[] = [
  { x: -8, y: 13, facing: 1 },
  { x: 8, y: 16, facing: -1 }
];
/** The crew goes up one after another, so the room watches each of them leave. */
const BAY_STAGGER = 0.045;
/** The last slot a crew can have (`BRAWL_CREW_WORLD.maxCrew` less one): she still lands by the end. */
const LAST_SLOT = 7;

/**
 * The bay, for the whole crew: every hen is down, and the geese come for the lot of them. Two
 * swoop in on each hen, take hold, and carry her up off the top of the frame — slot by slot, a
 * beat apart — and Kempenfelt Bay splashes at the bottom of it for each one. The punchline, and
 * a group shot. A hen who sat the fight out is left sitting.
 */
export const resolveBayBeat = (hen: BeatHen, progress: number): BayBeat => {
  if (hen.state !== "down") {
    return { hen: resolveBystander(hen), geese: [], splash: null };
  }

  const own = clamp01((progress - hen.slot * BAY_STAGGER) / (1 - LAST_SLOT * BAY_STAGGER));
  const swoop = smooth(own / GRAB_AT);
  const lift = own < GRAB_AT ? 0 : smooth((own - GRAB_AT) / (LIFT_UNTIL - GRAB_AT)) * LIFT_HEIGHT;

  return {
    hen: { pose: "ko", facing: hen.facing, dx: 0, lift, tilt: 0, opacity: 1 },
    geese:
      own <= 0
        ? []
        : HOLDS.map((hold) => ({
            x: hold.x - hold.facing * (1 - swoop) * SWOOP_FROM_SIDE,
            y: hold.y + lift + (1 - swoop) * SWOOP_FROM_UP,
            facing: hold.facing
          })),
    splash: own < LIFT_UNTIL ? null : clamp01((own - LIFT_UNTIL) / (1 - LIFT_UNTIL))
  };
};

/** The bell: every hen still up reels and then slumps forward over her feet while it rings out. */
export const resolveTimeoutBeat = (hen: BeatHen, progress: number): HenBeat => {
  if (hen.state !== "up") {
    return resolveBystander(hen);
  }

  return { pose: "hurt", facing: hen.facing, dx: 0, lift: 0, tilt: hen.facing * 14 * smooth((progress - hen.slot * SLOT_STAGGER) / 0.4) || 0, opacity: 1 };
};
