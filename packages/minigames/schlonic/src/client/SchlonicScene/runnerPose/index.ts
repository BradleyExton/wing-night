import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicGroundSlope } from "@wingnight/shared";

import { AIR_CLEARANCE } from "../../runnerClearance/index.js";

/**
 * How the runner is held at one frame. The runner is the player's own cast hen (§2.8) riding a
 * skateboard, and the hen has no spine to bend — its pose is how the whole rider is turned, how
 * tightly the hen is tucked over the board, and where the board is in its kickflip. On the
 * sidewalk it rolls, leaning with the ground; the moment it leaves the ground it ollies — the hen
 * tucks a little and the board flips once about its long axis under its feet — and the board
 * comes down level. Airborne is still the rule: a bird in the air is a bird off its board.
 *
 * Everything here is a pure function of the frame, with no state kept between paints, so the
 * tablet and the TV draw the same rider from the same frame without having to agree on anything.
 * The flip comes off the vertical speed rather than a clock, and it happens on the way UP: a tap
 * leaves the ground at the jump velocity and stops climbing at the top of its arc, so one ollie
 * is exactly one flip, caught level at the top and ridden down level. The way down is not
 * flippable, because a frame falling at some speed cannot tell an ollie's descent from a board
 * rolling off a rail's end or down a steep drop — only something that went up is a trick. And
 * nothing is air until the feet are clear of the surface under them (`AIR_CLEARANCE`): a board
 * drifting a unit off a hill is still rolling. The only thing the scene eases between frames is
 * the tuck (`curl`), because the hen folding over the board should not be a jump cut.
 */
export type RunnerPose = {
  /** Degrees the whole rider is turned through, about the hitbox's centre: lean, or pitch in the air. */
  angle: number;
  /** 0 standing on the board, 1 fully tucked into a ball (the bail's tumble). */
  tuck: number;
  /** A small knock in world units as the wheels cross a slab joint in the sidewalk. */
  bob: number;
  /** The board's roll about its long axis, in degrees: 0 wheels down, 180 wheels up. */
  flip: number;
};

/** How far the hen folds over the board in an ollie, as a share of a full tuck. */
export const AIR_TUCK = 0.3;
/** The sidewalk's slabs are this wide (`Ground`), and the wheels knock over every joint. */
const SLAB_UNITS = 8;
const JOINT_KNOCK = 0.3;
const JOINT_KNOCK_UNITS = 1.2;
/** Degrees of pitch per unit of vertical speed in the air: nose up going up, nose down coming down. */
const AIR_PITCH_PER_VY = 5;
const AIR_PITCH_MAX = 12;

export type RunnerPoseInput = {
  /** Distance travelled, which is what knocks the wheels over the slab joints. */
  x: number;
  /** Vertical speed, which is what drives the kickflip: the jump velocity up to its mirror down. */
  vy: number;
  /** How far the feet are off the surface under them (`resolveRunnerClearance`); 0 when down. */
  clearance: number;
  /** On a grind rail: level, locked, and no slab joints to knock over. */
  grinding: boolean;
  /** The ground's gradient under the runner, so a hill is leaned into rather than stood on. */
  slope: number;
  /** 0 on the board, 1 fully tucked. The scene eases this so the tuck is not a jump cut. */
  curl: number;
};

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

/**
 * Where the board is in its flip, 0 → 1, off the vertical speed alone: 0 as it leaves the ground
 * at the jump velocity, a half half way up, 1 at the top of the arc and all the way down. A
 * kicker throws harder than a jump, so the board holds level until the climb has slowed to
 * a jump's, and flips on the rest of the way up.
 */
export const resolveFlipProgress = (vy: number): number => {
  const launch = SCHLONIC_WORLD.jumpVelocity;

  return clamp((vy - launch) / -launch, 0, 1);
};

export const resolveRunnerPose = ({ x, vy, clearance, grinding, slope, curl }: RunnerPoseInput): RunnerPose => {
  const eased = clamp(curl, 0, 1);
  const leanDegrees = (Math.atan(slope) * 180) / Math.PI;
  const pitchDegrees = clamp(vy * AIR_PITCH_PER_VY, -AIR_PITCH_MAX, AIR_PITCH_MAX);
  const jointShare = (((x % SLAB_UNITS) + SLAB_UNITS) % SLAB_UNITS) / JOINT_KNOCK_UNITS;
  const isAirborne = clearance > AIR_CLEARANCE;

  return {
    angle: grinding ? 0 : leanDegrees * (1 - eased) + pitchDegrees * eased,
    tuck: eased * AIR_TUCK,
    bob: !isAirborne && !grinding ? Math.max(0, 1 - jointShare) * JOINT_KNOCK * (1 - eased) : 0,
    // Wheels down at both ends of the flip: 360 is written as 0, so a caught board reads level.
    flip: isAirborne ? (resolveFlipProgress(vy) * 360) % 360 : 0
  };
};

/**
 * What the runner leans with at this frame: the ground's gradient under it, or none on a rail —
 * a rail is level, and a bird grinding one over a hill stands on the rail, not the hill.
 */
export const resolveRunnerSlope = (zone: SchlonicZone, frame: SchlonicFrame): number => {
  return frame.grindingRail === null ? resolveSchlonicGroundSlope(zone, frame.x) : 0;
};

/**
 * How tucked the runner is at this frame. In the air (`isRunnerAirborne`, not the sim's
 * flickering `grounded`) it folds over the board, and fast.
 */
export const resolveRunnerCurl = (airborne: boolean, previousCurl: number): number => {
  const target = airborne ? 1 : 0;

  return previousCurl + (target - previousCurl) * 0.45;
};

/**
 * The bail: how far through the mercy window after its last hit the rider is, 0 → 1, or null
 * outside one. The board shoots out ahead, the hen tumbles, and it is back on the board as the
 * window closes — purely a picture of the frame's own `hits`, so both screens bail together.
 */
export const resolveBailShare = (frame: Pick<SchlonicFrame, "hits" | "tick">): number | null => {
  const lastHit = frame.hits[frame.hits.length - 1];

  if (lastHit === undefined) {
    return null;
  }

  const since = frame.tick - lastHit;

  return since >= 0 && since < SCHLONIC_WORLD.invulnerableTicks ? since / SCHLONIC_WORLD.invulnerableTicks : null;
};
