import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, isSchlonicOverPit, resolveSchlonicGroundY } from "@wingnight/shared";

import { SHORE_Y } from "../Backdrop/index.js";
import type { SchlonicCamera } from "../camera/index.js";
import { GULL_HAUL_DROP } from "../Gull/index.js";

/**
 * A run that ends badly ends on a joke the game told, not on a verdict
 * (docs/minigame-design-principles.md §8, §9). Both jokes are the demand that beat the player,
 * played to its conclusion on the wall before the card goes up:
 *
 *   fell    the hole goes somewhere — the hen surfaces in the bay with a splash, and a gull
 *           takes the handful it was carrying
 *   wiped   the hit that found it empty-handed knocks it flat, and the wings it dropped roll
 *           down the shore to the nearest badnik, which eats them
 *
 * This is the whole timeline as pure functions of the beat's elapsed milliseconds, so the scene
 * paints from it and the mirror sounds from it and neither keeps a clock of its own. Everything
 * lands inside `PUNCHLINE_MS` (`beats/`); the card goes up after that.
 */

export type PunchlineCue = "splash" | "squawk" | "chomp" | "burp";

export type PunchlineCueMark = { atMs: number; cue: PunchlineCue };

type Point = { x: number; y: number };

// The fall. The hen goes down the shaft, then the bay spits it back out.
export const FALL_DROP_MS = 420;
export const FALL_SPLASH_AT_MS = 480;
export const FALL_SPLASH_MS = 560;
export const FALL_SURFACE_MS = 340;
export const GULL_IN_AT_MS = 820;
export const GULL_GRAB_AT_MS = 1250;
export const GULL_OUT_AT_MS = 1880;

// The wipeout. Knocked flat, then the wings go one at a time.
export const WIPEOUT_KNOCK_MS = 420;
export const WIPEOUT_DROPPED_WINGS = 5;
export const ROLL_STAGGER_MS = 110;
export const ROLL_MS = 650;
export const CHOMP_MS = 140;
export const BURP_AT_MS = 1760;
const BURP_SWELL_MS = 190;

/** The water line the hen surfaces at: a little under the bay's near edge, clear of the beach. */
export const BAY_SURFACE_Y = SHORE_Y - 6;
/** Where the hen bobs, surfaced: head and chest out, the rest of it the bay's. */
export const BAY_HEN_Y = BAY_SURFACE_Y + 1;
const BAY_HEN_UNDER_Y = BAY_SURFACE_Y + 18;

/** Where the dropped wings land either side of the hen, in world units. */
const DROP_SPREAD = [-11, -5, 2, 8, 14] as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, share: number): number => from + (to - from) * share;
const easeOutBack = (share: number): number => {
  const overshoot = 1.9;
  const shifted = share - 1;

  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
};

/** When the i-th dropped wing reaches the badnik's mouth. */
export const resolveChompAtMs = (index: number): number => {
  return WIPEOUT_KNOCK_MS + index * ROLL_STAGGER_MS + ROLL_MS;
};

/**
 * What the wall says as the joke plays, in order. A fall with nothing in hand has nothing for a
 * gull to take, so it is the splash alone.
 */
export const resolvePunchlineCues = (outcome: "fell" | "wiped", wingsLost: number): PunchlineCueMark[] => {
  if (outcome === "fell") {
    const cues: PunchlineCueMark[] = [{ atMs: FALL_SPLASH_AT_MS, cue: "splash" }];

    if (wingsLost > 0) {
      cues.push({ atMs: GULL_GRAB_AT_MS, cue: "squawk" });
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

/** How many wings the gull flies off with, as a drawing: one to three, by the size of the handful. */
export const resolveBundleSize = (wingsLost: number): number => {
  return wingsLost <= 0 ? 0 : Math.min(3, Math.ceil(wingsLost / 10));
};

/** Where something resting on the shore sits at `x`: on the ground, or on a hole's lips. */
export const resolveRestY = (zone: SchlonicZone, x: number): number => {
  if (isSchlonicOverPit(zone, x)) {
    return zone.pits.find((pit) => x >= pit.fromX && x <= pit.toX)?.lipY ?? SCHLONIC_WORLD.groundBaseY;
  }

  return resolveSchlonicGroundY(zone, x);
};

// ── The fall ────────────────────────────────────────────────────────────────────────────────

const BAY_X_LEAD = 34;
const BAY_X_STEP = 6;
const BAY_CLEAR_BEFORE = 10;
const BAY_CLEAR_AFTER = 16;

/**
 * Where on screen the hen comes up: the first stretch ahead of it where the shore is low enough
 * that the bay shows above it, so the joke is not played behind a hill. The bay never scrolls,
 * so this is a screen x, found by reading the ground under it on the frame the run ended.
 */
export const resolveBayX = (zone: SchlonicZone, frame: SchlonicFrame, camera: SchlonicCamera): number => {
  const scrollX = frame.x - SCHLONIC_WORLD.runnerX;
  const first = SCHLONIC_WORLD.runnerX + BAY_X_LEAD;
  const last = camera.x + camera.width - BAY_CLEAR_AFTER;

  for (let screenX = first; screenX <= last; screenX += BAY_X_STEP) {
    let isClear = true;

    for (let probe = screenX - BAY_CLEAR_BEFORE; probe <= screenX + BAY_CLEAR_AFTER; probe += 2) {
      if (resolveSchlonicGroundY(zone, scrollX + probe) < SHORE_Y + 2) {
        isClear = false;
        break;
      }
    }

    if (isClear) {
      return screenX;
    }
  }

  return first;
};

/** The hen in the water: under until the splash, then up with a bob and a shake of the head. */
export const resolveBayHen = (
  elapsedMs: number,
  bayX: number
): { visible: boolean; x: number; y: number; angle: number } => {
  const since = elapsedMs - FALL_SPLASH_AT_MS;

  if (since < 0) {
    return { visible: false, x: bayX, y: BAY_HEN_UNDER_Y, angle: 0 };
  }

  const rise = easeOutBack(clamp01(since / FALL_SURFACE_MS));
  const bob = Math.sin(since / 190) * 0.6;
  const shake = Math.sin(since / 70) * 9 * (1 - clamp01(since / 900));

  return {
    visible: true,
    x: bayX,
    y: lerp(BAY_HEN_UNDER_Y, BAY_HEN_Y, rise) + bob,
    angle: shake
  };
};

/** Where the handful floats, beside the hen, until the gull has it. */
export const resolveBundleRest = (elapsedMs: number, bayX: number): Point => {
  const since = Math.max(0, elapsedMs - FALL_SPLASH_AT_MS);

  return { x: bayX + 11, y: BAY_SURFACE_Y - 1 + Math.sin(since / 160 + 1) * 0.7 };
};

export type GullFlight = {
  visible: boolean;
  x: number;
  y: number;
  /** Nose down on the dive, nose up on the climb, in degrees. */
  angle: number;
  /** The wings' beat, -1 → 1: held nearly still on the dive, hard on the climb. */
  flap: number;
  carrying: boolean;
};

/**
 * The gull swoops in from the top of the picture behind the hen, snatches the handful off the
 * water, and climbs away out of the top of the picture ahead, towards the sun.
 */
export const resolveGullFlight = (
  elapsedMs: number,
  bundle: Point,
  camera: SchlonicCamera
): GullFlight => {
  if (elapsedMs < GULL_IN_AT_MS || elapsedMs > GULL_OUT_AT_MS) {
    return { visible: false, x: bundle.x, y: camera.y - 20, angle: 0, flap: 0, carrying: false };
  }

  const from = { x: bundle.x - 52, y: camera.y - 14 };
  const grab = { x: bundle.x, y: bundle.y - GULL_HAUL_DROP };
  const to = { x: bundle.x + 70, y: camera.y - 22 };

  if (elapsedMs < GULL_GRAB_AT_MS) {
    const share = (elapsedMs - GULL_IN_AT_MS) / (GULL_GRAB_AT_MS - GULL_IN_AT_MS);

    return {
      visible: true,
      x: lerp(from.x, grab.x, share),
      y: lerp(from.y, grab.y, Math.sin((share * Math.PI) / 2)),
      angle: 28 * (1 - share),
      flap: Math.sin(elapsedMs / 150) * 0.25,
      carrying: false
    };
  }

  const share = (elapsedMs - GULL_GRAB_AT_MS) / (GULL_OUT_AT_MS - GULL_GRAB_AT_MS);

  return {
    visible: true,
    x: lerp(grab.x, to.x, share),
    y: lerp(grab.y, to.y, 1 - Math.cos((share * Math.PI) / 2)),
    angle: -24 * Math.min(1, share * 3),
    flap: Math.sin(elapsedMs / 45),
    carrying: true
  };
};

// ── The wipeout ─────────────────────────────────────────────────────────────────────────────

export type Eater =
  | { kind: "zone"; propIndex: number; x: number; y: number }
  | { kind: "standIn"; x: number; y: number; fromX: number };

const EATER_MARGIN = 6;
const STAND_IN_LEAD = 24;
const STAND_IN_ARRIVES_MS = WIPEOUT_KNOCK_MS + 220;

/**
 * Who eats the wings: the nearest badnik still standing that this camera can see — usually the
 * one that did it. With none in the picture, one hops in from the edge ahead, because a joke
 * played to a badnik off the side of the screen is not a joke.
 */
export const resolveEater = (zone: SchlonicZone, frame: SchlonicFrame, camera: SchlonicCamera): Eater => {
  const scrollX = frame.x - SCHLONIC_WORLD.runnerX;
  const fromX = scrollX + camera.x + EATER_MARGIN;
  const toX = scrollX + camera.x + camera.width - EATER_MARGIN;
  const taken = new Set(frame.takenProps);
  let nearest: Eater | null = null;
  let nearestGap = Number.POSITIVE_INFINITY;

  for (const prop of zone.props) {
    if (prop.kind !== "badnik" || taken.has(prop.index) || prop.x < fromX || prop.x > toX) {
      continue;
    }

    const gap = Math.abs(prop.x - frame.x);

    if (gap < nearestGap) {
      nearestGap = gap;
      nearest = { kind: "zone", propIndex: prop.index, x: prop.x, y: prop.y };
    }
  }

  if (nearest !== null) {
    return nearest;
  }

  const x = frame.x + STAND_IN_LEAD;

  return { kind: "standIn", x, y: resolveRestY(zone, x), fromX: toX + EATER_MARGIN * 2 };
};

/** Where the stand-in is: hopping in from the edge until it is in place beside the hen. */
export const resolveStandInPlace = (eater: Eater, zone: SchlonicZone, elapsedMs: number): Point => {
  if (eater.kind === "zone") {
    return { x: eater.x, y: eater.y };
  }

  const share = clamp01(elapsedMs / STAND_IN_ARRIVES_MS);
  const x = lerp(eater.fromX, eater.x, share);
  const hop = share < 1 ? Math.abs(Math.sin(share * Math.PI * 3)) * 3 : 0;

  return { x, y: resolveRestY(zone, x) - hop };
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

/** The share of a wing's roll spent on the ground; the rest is the hop up into the mouth. */
const ROLL_SHARE = 0.72;

export type DroppedWing = { visible: boolean; x: number; y: number; spin: number };

/**
 * One of the dropped wings, in world units: thrown out of the hen as it goes over, landed on
 * the shore, then rolled down it to the eater and hopped up into its mouth.
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
  const footX = eater.x - side * (SCHLONIC_WORLD.badnikWidth * 0.5);
  const mouth = { x: eater.x - 0.5, y: eater.y - SCHLONIC_WORLD.badnikHeight + 2.4 };
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
 * The eater's squash and stretch about its own base: a gulp as each wing goes in, then a
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
export const PUNCHLINE_END_MS = Math.max(GULL_OUT_AT_MS, BURP_AT_MS + BURP_SWELL_MS);

