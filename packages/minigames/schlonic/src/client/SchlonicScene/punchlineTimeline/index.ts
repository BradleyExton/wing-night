import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_HAZARDS, SCHLONIC_WORLD, isSchlonicOverPit, resolveSchlonicGroundY } from "@wingnight/shared";

import type { SchlonicCamera } from "../camera/index.js";

/**
 * A run that ends badly ends on a joke the game told, not on a verdict
 * (docs/minigame-design-principles.md §8, §9). Both jokes are the demand that beat the player,
 * played to its conclusion on the wall before the card goes up:
 *
 *   fell    the trench was a real dig — the hen lands at the bottom in a cloud of dust and
 *           peeks back up over the lip, and a raccoon in a hard hat climbs out beside it with
 *           the handful it was carrying, chitters, and runs off down the street with it
 *   wiped   the hit that found it empty-handed knocks it flat, the board rolls off without it,
 *           and the wings it dropped roll down the sidewalk to a goose that walks in off the
 *           edge of the picture and eats them, one gulp each
 *
 * This is the whole timeline as pure functions of the beat's elapsed milliseconds, so the scene
 * paints from it and the mirror sounds from it and neither keeps a clock of its own. Everything
 * lands inside `PUNCHLINE_MS` (`beats/`); the card goes up after that.
 */

export type PunchlineCue = "thud" | "chitter" | "chomp" | "burp";

export type PunchlineCueMark = { atMs: number; cue: PunchlineCue };

type Point = { x: number; y: number };

// The fall. The hen goes down the trench, the dust comes up out of it, and so does the raccoon.
export const FALL_DROP_MS = 420;
export const FALL_THUD_AT_MS = 480;
export const FALL_DUST_MS = 820;
export const FALL_PEEK_MS = 340;
export const RACCOON_IN_AT_MS = 820;
/** Out of the trench and up on the far lip: it turns to the hen and chitters. */
export const RACCOON_CHITTER_AT_MS = 1250;
export const RACCOON_OUT_AT_MS = 1880;
const RACCOON_CLIMBED_AT_MS = 1100;
const RACCOON_RUNS_AT_MS = 1480;

// The wipeout. Knocked flat, then the wings go one at a time.
export const WIPEOUT_KNOCK_MS = 420;
export const WIPEOUT_DROPPED_WINGS = 5;
export const ROLL_STAGGER_MS = 110;
export const ROLL_MS = 650;
export const CHOMP_MS = 140;
export const BURP_AT_MS = 1760;
const BURP_SWELL_MS = 190;

/** Where the dropped wings land either side of the hen, in world units. */
const DROP_SPREAD = [-11, -5, 2, 8, 14] as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, share: number): number => from + (to - from) * share;
const easeOutBack = (share: number): number => {
  const overshoot = 1.9;
  const shifted = share - 1;

  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
};

/** When the i-th dropped wing reaches the goose's bill. */
export const resolveChompAtMs = (index: number): number => {
  return WIPEOUT_KNOCK_MS + index * ROLL_STAGGER_MS + ROLL_MS;
};

/**
 * What the wall says as the joke plays, in order. A fall with nothing in hand has nothing for a
 * raccoon to take, so it is the thud alone.
 */
export const resolvePunchlineCues = (outcome: "fell" | "wiped", wingsLost: number): PunchlineCueMark[] => {
  if (outcome === "fell") {
    const cues: PunchlineCueMark[] = [{ atMs: FALL_THUD_AT_MS, cue: "thud" }];

    if (wingsLost > 0) {
      cues.push({ atMs: RACCOON_CHITTER_AT_MS, cue: "chitter" });
    }

    return cues;
  }

  return [
    ...Array.from({ length: WIPEOUT_DROPPED_WINGS }, (_unused, index): PunchlineCueMark => ({
      atMs: resolveChompAtMs(index),
      cue: "chomp"
    })),
    { atMs: BURP_AT_MS, cue: "burp" }
  ];
};

/** The cues whose moment falls in (fromMs, toMs]: what a loop that has just stepped should sound. */
export const resolveDueCues = (
  cues: readonly PunchlineCueMark[],
  fromMs: number,
  toMs: number
): PunchlineCue[] => {
  return cues.filter((mark) => mark.atMs > fromMs && mark.atMs <= toMs).map((mark) => mark.cue);
};

/** How many wings the raccoon makes off with, as a drawing: one to three, by the size of the handful. */
export const resolveBundleSize = (wingsLost: number): number => {
  return wingsLost <= 0 ? 0 : Math.min(3, Math.ceil(wingsLost / 10));
};

/** Where something resting on the street sits at `x`: on the ground, or level with a trench's lips. */
export const resolveRestY = (zone: SchlonicZone, x: number): number => {
  if (isSchlonicOverPit(zone, x)) {
    return zone.pits.find((pit) => x >= pit.fromX && x <= pit.toX)?.lipY ?? SCHLONIC_WORLD.groundBaseY;
  }

  return resolveSchlonicGroundY(zone, x);
};

// ── The fall ────────────────────────────────────────────────────────────────────────────────

/** The trench that took the hen, on screen: its two lips' x and the height of the street at them. */
export type Trench = { fromX: number; toX: number; lipY: number };

/** How wide a stand-in trench is when the run somehow fell with no hole under it. */
const STAND_IN_HALF_WIDTH = 11;

/**
 * The trench the hen went down, in screen x: the hole under the frame the run ended on (or the
 * nearest one, if the last step carried it to a lip). It is under the runner by definition, so
 * it is always in the picture.
 */
export const resolveTrench = (zone: SchlonicZone, frame: SchlonicFrame): Trench => {
  const scrollX = frame.x - SCHLONIC_WORLD.runnerX;
  const pit = [...zone.pits].sort((left, right) => {
    const gap = (pit: { fromX: number; toX: number }): number =>
      frame.x < pit.fromX ? pit.fromX - frame.x : frame.x > pit.toX ? frame.x - pit.toX : 0;

    return gap(left) - gap(right);
  })[0];

  if (pit === undefined) {
    return {
      fromX: SCHLONIC_WORLD.runnerX - STAND_IN_HALF_WIDTH,
      toX: SCHLONIC_WORLD.runnerX + STAND_IN_HALF_WIDTH,
      lipY: resolveSchlonicGroundY(zone, frame.x)
    };
  }

  return { fromX: pit.fromX - scrollX, toX: pit.toX - scrollX, lipY: pit.lipY };
};

/** The hen, peeking up: head and chest over the lip, the rest of it the trench's. */
export const TRENCH_HEN_BELOW_LIP = 0.5;
const TRENCH_HEN_UNDER = 18;
/** How far in from the near lip the hen comes up, and how much room it leaves the raccoon. */
const HEN_IN_FROM_NEAR = 5;
const HEN_CLEAR_OF_FAR = 16;
/** The raccoon climbs out this far in from the far lip, and stands this far past it. */
const RACCOON_IN_FROM_FAR = 2.4;
const RACCOON_ON_LIP = 4;

/** Where the hen comes up: under where it fell, but never in the raccoon's way. */
export const resolveTrenchHenX = (trench: Trench): number => {
  const nearest = trench.fromX + HEN_IN_FROM_NEAR;

  return Math.max(nearest, Math.min(SCHLONIC_WORLD.runnerX, trench.toX - HEN_CLEAR_OF_FAR));
};

/** The hen in the trench: out of sight until the thud, then up to the lip with a dazed shake. */
export const resolveTrenchHen = (
  elapsedMs: number,
  trench: Trench
): { visible: boolean; x: number; y: number; angle: number } => {
  const since = elapsedMs - FALL_THUD_AT_MS;
  const x = resolveTrenchHenX(trench);
  const under = trench.lipY + TRENCH_HEN_UNDER;

  if (since < 0) {
    return { visible: false, x, y: under, angle: 0 };
  }

  const rise = easeOutBack(clamp01(since / FALL_PEEK_MS));
  const shake = Math.sin(since / 70) * 9 * (1 - clamp01(since / 900));

  return {
    visible: true,
    x,
    y: lerp(under, trench.lipY + TRENCH_HEN_BELOW_LIP, rise),
    angle: shake
  };
};

export type RaccoonPlacement = {
  visible: boolean;
  /** The feet, in screen x and world y. */
  x: number;
  y: number;
  /** Still inside the trench, so the lip hides what is under it. */
  isClimbing: boolean;
  /** Where its legs are in a stride, -1 → 1: scrabbling up the wall, then running. */
  stride: number;
  /** 0 → 1 while it chitters at the hen from the lip, a wiggle of the whole animal. */
  chitter: number;
};

/**
 * The raccoon: up the far wall of the trench with the handful hugged to its chest, a hop onto
 * the far lip, a chitter at the hen, and off down the sidewalk out of the right of the picture.
 */
export const resolveRaccoon = (
  elapsedMs: number,
  trench: Trench,
  camera: SchlonicCamera,
  groundAt: (screenX: number) => number
): RaccoonPlacement => {
  const climbX = trench.toX - RACCOON_IN_FROM_FAR;
  const lipX = trench.toX + RACCOON_ON_LIP;
  const hidden = { visible: false, x: climbX, y: trench.lipY + 16, isClimbing: true, stride: 0, chitter: 0 };

  if (elapsedMs < RACCOON_IN_AT_MS || elapsedMs > RACCOON_OUT_AT_MS) {
    return hidden;
  }

  if (elapsedMs < RACCOON_CLIMBED_AT_MS) {
    const share = (elapsedMs - RACCOON_IN_AT_MS) / (RACCOON_CLIMBED_AT_MS - RACCOON_IN_AT_MS);

    return {
      visible: true,
      x: climbX + Math.sin(elapsedMs / 45) * 0.4,
      y: lerp(trench.lipY + 16, trench.lipY + 2.5, 1 - (1 - share) ** 2),
      isClimbing: true,
      stride: Math.sin(elapsedMs / 40),
      chitter: 0
    };
  }

  if (elapsedMs < RACCOON_CHITTER_AT_MS) {
    const share = (elapsedMs - RACCOON_CLIMBED_AT_MS) / (RACCOON_CHITTER_AT_MS - RACCOON_CLIMBED_AT_MS);
    const x = lerp(climbX, lipX, share);

    return {
      visible: true,
      x,
      y: lerp(trench.lipY + 2.5, groundAt(lipX), share) - Math.sin(share * Math.PI) * 4,
      isClimbing: share < 0.5,
      stride: 0,
      chitter: 0
    };
  }

  if (elapsedMs < RACCOON_RUNS_AT_MS) {
    return {
      visible: true,
      x: lipX,
      y: groundAt(lipX),
      isClimbing: false,
      stride: 0,
      chitter: (elapsedMs - RACCOON_CHITTER_AT_MS) / (RACCOON_RUNS_AT_MS - RACCOON_CHITTER_AT_MS)
    };
  }

  const share = (elapsedMs - RACCOON_RUNS_AT_MS) / (RACCOON_OUT_AT_MS - RACCOON_RUNS_AT_MS);
  const x = lerp(lipX, camera.x + camera.width + 14, share * share);

  return {
    visible: true,
    x,
    y: groundAt(x) - Math.abs(Math.sin(elapsedMs / 55)) * 1.2,
    isClimbing: false,
    stride: Math.sin(elapsedMs / 35),
    chitter: 0
  };
};

/** The dust the thud throws up out of the trench: 0 → 1 across the cloud, or null outside it. */
export const resolveDustShare = (elapsedMs: number): number | null => {
  const share = (elapsedMs - FALL_THUD_AT_MS) / FALL_DUST_MS;

  return share < 0 || share > 1 ? null : share;
};

// ── The wipeout ─────────────────────────────────────────────────────────────────────────────

/** Who eats the wings: a goose, and where it stands to do it, and where it walks in from. */
export type Eater = { x: number; y: number; fromX: number };

const EATER_MARGIN = 6;
const STAND_IN_LEAD = 24;
const STAND_IN_ARRIVES_MS = WIPEOUT_KNOCK_MS + 220;

/**
 * Who eats the wings: a goose, every time — the one animal in Barrie that would — walking in
 * from the edge of the picture ahead of the hen to a spot just past it, because a joke played
 * to something off the side of the screen is not a joke. The crowd that did the hitting stays
 * where it is: it is not a goose's business to be blamed.
 */
export const resolveEater = (zone: SchlonicZone, frame: SchlonicFrame, camera: SchlonicCamera): Eater => {
  const scrollX = frame.x - SCHLONIC_WORLD.runnerX;
  const toX = scrollX + camera.x + camera.width - EATER_MARGIN;
  const x = frame.x + STAND_IN_LEAD;

  return { x, y: resolveRestY(zone, x), fromX: toX + EATER_MARGIN * 2 };
};

/** Where the goose is: waddling in from the edge until it is in place beside the hen. */
export const resolveStandInPlace = (eater: Eater, zone: SchlonicZone, elapsedMs: number): Point => {
  const share = clamp01(elapsedMs / STAND_IN_ARRIVES_MS);
  const x = lerp(eater.fromX, eater.x, share);
  const waddle = share < 1 ? Math.abs(Math.sin(share * Math.PI * 6)) * 0.8 : 0;

  return { x, y: resolveRestY(zone, x) - waddle };
};

/**
 * How high the hitbox's centre sits over the ground with the bird upside down: the cast stands
 * `runnerRadius` under the centre, so flipped over, its body hangs the rest of its height below.
 */
const KNOCKED_CENTRE_ABOVE = 9;

/** The hen, knocked back off its feet and flat on its back, in screen x and world y. */
export const resolveKnockedHen = (
  elapsedMs: number,
  frame: SchlonicFrame,
  zone: SchlonicZone
): { dx: number; y: number; angle: number } => {
  const share = clamp01(elapsedMs / WIPEOUT_KNOCK_MS);
  const dx = -7 * (1 - (1 - share) ** 2);
  const lieY = resolveRestY(zone, frame.x + dx) - KNOCKED_CENTRE_ABOVE;
  const lift = Math.sin(share * Math.PI) * 9;
  const settle = share < 1 ? 0 : Math.sin((elapsedMs - WIPEOUT_KNOCK_MS) / 120) * 4;

  return {
    dx,
    y: lerp(frame.y, lieY, share) - lift,
    angle: -168 * share + settle
  };
};

/** How far ahead the board rolls on without the hen, and how long it takes to get there. */
const RUNAWAY_RUN = 34;
const RUNAWAY_MS = 1100;

/**
 * The board, off on its own: kicked out from under the hen as it goes over, it bounces once and
 * rolls on up the sidewalk, slowing, in screen x and world y (the wheels' contact point).
 */
export const resolveRunawayBoard = (
  elapsedMs: number,
  frame: SchlonicFrame,
  zone: SchlonicZone
): { x: number; y: number; hop: number } => {
  const share = clamp01(elapsedMs / RUNAWAY_MS);
  const run = RUNAWAY_RUN * (1 - (1 - share) ** 2);

  return {
    x: SCHLONIC_WORLD.runnerX + run,
    y: resolveRestY(zone, frame.x + run),
    hop: Math.sin(clamp01(elapsedMs / WIPEOUT_KNOCK_MS) * Math.PI) * 4
  };
};

/** The share of a wing's roll spent on the ground; the rest is the hop up into the mouth. */
const ROLL_SHARE = 0.72;

export type DroppedWing = { visible: boolean; x: number; y: number; spin: number };

/**
 * One of the dropped wings, in world units: thrown out of the hen as it goes over, landed on
 * the sidewalk, then rolled down it to the eater and hopped up into its mouth.
 */
export const resolveDroppedWing = (
  index: number,
  elapsedMs: number,
  frame: SchlonicFrame,
  zone: SchlonicZone,
  eater: Eater
): DroppedWing => {
  const radius = SCHLONIC_WORLD.wingRadius * 0.8;
  const landX = frame.x + (DROP_SPREAD[index % DROP_SPREAD.length] ?? 0);
  const landY = resolveRestY(zone, landX) - radius;
  const rollFrom = WIPEOUT_KNOCK_MS + index * ROLL_STAGGER_MS;
  const arriveAt = resolveChompAtMs(index);

  if (elapsedMs >= arriveAt) {
    return { visible: false, x: eater.x, y: eater.y, spin: 0 };
  }

  if (elapsedMs < WIPEOUT_KNOCK_MS) {
    const share = elapsedMs / WIPEOUT_KNOCK_MS;

    return {
      visible: true,
      x: lerp(frame.x, landX, share),
      y: lerp(frame.y, landY, share) - Math.sin(share * Math.PI) * (8 + (index % 3) * 2),
      spin: share * 360 * (index % 2 === 0 ? 1 : -1)
    };
  }

  if (elapsedMs < rollFrom) {
    return { visible: true, x: landX, y: landY, spin: 0 };
  }

  const side = eater.x >= landX ? 1 : -1;
  const footX = eater.x - side * (SCHLONIC_HAZARDS.goose.width * 0.5);
  // The goose's bill: out front and up its neck (`Crowd/Goose`), where the wings go in.
  const mouth = { x: eater.x + 5.5, y: eater.y - 8.4 };
  const share = (elapsedMs - rollFrom) / ROLL_MS;

  if (share < ROLL_SHARE) {
    const along = share / ROLL_SHARE;
    const eased = along * along * (3 - 2 * along);
    const x = lerp(landX, footX, eased);

    return {
      visible: true,
      x,
      y: resolveRestY(zone, x) - radius,
      spin: (((x - landX) / radius) * 180) / Math.PI
    };
  }

  const hop = (share - ROLL_SHARE) / (1 - ROLL_SHARE);
  const footY = resolveRestY(zone, footX) - radius;

  return {
    visible: true,
    x: lerp(footX, mouth.x, hop),
    y: lerp(footY, mouth.y, hop) - Math.sin(hop * Math.PI) * 5,
    spin: (((footX - landX) / radius) * 180) / Math.PI + hop * 200 * side
  };
};

/**
 * The goose's squash and stretch about its own feet: a gulp as each wing goes in, then a
 * satisfied swell at the burp.
 */
export const resolveEaterSquash = (elapsedMs: number): { sx: number; sy: number } => {
  for (let index = 0; index < WIPEOUT_DROPPED_WINGS; index += 1) {
    const since = elapsedMs - resolveChompAtMs(index);

    if (since >= 0 && since < CHOMP_MS) {
      const gulp = Math.sin((since / CHOMP_MS) * Math.PI);

      return { sx: 1 + 0.18 * gulp, sy: 1 - 0.28 * gulp };
    }
  }

  const sinceBurp = elapsedMs - BURP_AT_MS;

  if (sinceBurp >= 0 && sinceBurp < BURP_SWELL_MS) {
    const swell = Math.sin((sinceBurp / BURP_SWELL_MS) * Math.PI);

    return { sx: 1 + 0.14 * swell, sy: 1 + 0.2 * swell };
  }

  return { sx: 1, sy: 1 };
};

/** Every mark lands inside the joke, so the card never goes up over the punchline. */
export const PUNCHLINE_END_MS = Math.max(RACCOON_OUT_AT_MS, BURP_AT_MS + BURP_SWELL_MS);

