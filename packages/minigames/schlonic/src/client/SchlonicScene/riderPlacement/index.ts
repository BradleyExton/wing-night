import { CHARACTER_FOOT, CHARACTER_RIDE_STANCE } from "@wingnight/cast";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicGroundSlope } from "@wingnight/shared";

import { resolveRestY } from "../punchlineTimeline/index.js";
import { BOARD_DEPTH, TRUCK_XS, WHEEL_RADIUS } from "../Skateboard/index.js";
import { resolveBailShare, resolveRunnerPose, resolveRunnerSlope, type RunnerPose } from "../runnerPose/index.js";

/** The cast's 80×72 box drawn at this scale in world units: the hen, and the board under it. */
export const RUNNER_SCALE = 0.18;
/** A tucked bird is pulled down onto the hitbox's own centre, so a tumble turns on the spot. */
export const TUCK_DROP = 2.5;
export const TUCK_SHRINK = 0.12;
/** How far the board lifts the hen off the ground, in world units. */
export const BOARD_LIFT = BOARD_DEPTH * RUNNER_SCALE;

/** How far below the feet the board drops at the top of a kickflip, in the figure's units. */
const FLIP_GAP = 5;
/** Nose up on a rail, about the back truck: a 5-0, the grind that reads side on. */
const GRIND_TILT = -7;
/** On a rail the hanger rides the bar, not the wheels: the rider sits this much lower. */
const GRIND_DROP = WHEEL_RADIUS * 2 * RUNNER_SCALE;
const BACK_TRUCK_X = ((TRUCK_XS[0] ?? CHARACTER_FOOT.x) - CHARACTER_FOOT.x) * RUNNER_SCALE;

// The bail, as shares of the mercy window. The hen tumbles over once, the board squirts out
// ahead, rolls to a stop and is caught up with, and the hen steps back on as the window closes.
const TUMBLE_UNTIL = 0.7;
const UNTUCK_OVER = 0.15;
const BOARD_BACK_AT = 0.85;
const STEP_ON_FROM = 0.8;
const STEP_ON_OVER = 0.12;
const BAIL_BOARD_RUN = 20;
const BAIL_BOARD_POP = 4;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const smooth = (share: number): number => {
  const clamped = clamp01(share);

  return clamped * clamped * (3 - 2 * clamped);
};

export type SparkPlacement = { visible: boolean; x: number; y: number; seed: number };

export type RiderPlacement = {
  pose: RunnerPose;
  /** How far through a bail the rider is, 0 → 1, or null riding. */
  bail: number | null;
  grinding: boolean;
  /** The hen's group, in world units: where it is and how it is turned. */
  hen: string;
  /** The figure inside it, stood on the board (or the ground) and tucked. */
  stance: string;
  /** The board's group, straight into the figure's units: under the feet, or loose on the ground. */
  board: string;
  /** The board's roll about its long axis, in degrees (`Skateboard.roll`). */
  boardRoll: number;
  sparks: SparkPlacement;
};

export type RiderPlacementInput = {
  zone: SchlonicZone;
  frame: SchlonicFrame;
  /** Where on screen the rider stands: the runner's fixed x, or the ghost's offset from it. */
  screenX: number;
  /** The eased tuck carried between frames by the caller (`resolveRunnerCurl`). */
  curl: number;
  /** Extra world units down (negative is up), for a beat that hops the rider in place. */
  sink?: number;
};

/** The figure's units, stood with the deck's top (or a bare sole) `feetY` world units under the centre. */
export const resolveStanceTransform = (feetY: number, tuck: number): string => {
  return `translate(0 ${feetY + tuck * TUCK_DROP}) scale(${RUNNER_SCALE * (1 - tuck * TUCK_SHRINK)}) translate(${-CHARACTER_FOOT.x} ${-CHARACTER_RIDE_STANCE.deckY})`;
};

/** A loose board, its wheels on the ground at a world point: for the bail and the punchlines. */
export const resolveLooseBoardTransform = (x: number, groundY: number, angle: number): string => {
  return `translate(${x} ${groundY}) rotate(${angle}) scale(${RUNNER_SCALE}) translate(${-CHARACTER_FOOT.x} ${-(
    CHARACTER_RIDE_STANCE.deckY + BOARD_DEPTH
  )})`;
};

const slopeDegrees = (zone: SchlonicZone, x: number): number => {
  return (Math.atan(resolveSchlonicGroundSlope(zone, x)) * 180) / Math.PI;
};

/**
 * Where the hen and its board go on one frame, as the transforms the scene writes. Pure, so the
 * runner and the ghost are placed by the same rule and the tablet and the TV agree: riding, the
 * board shares the hen's transform and lies under its feet; in the air it drops a little and
 * flips; on a rail it rides the hanger with the nose up and throws sparks off the back truck;
 * and in a bail it is loose on the street, ahead of a tumbling hen, until the hen catches it up.
 */
export const resolveRiderPlacement = ({ zone, frame, screenX, curl, sink = 0 }: RiderPlacementInput): RiderPlacement => {
  const bail = resolveBailShare(frame);
  const grinding = frame.grindingRail !== null && bail === null;
  const pose = resolveRunnerPose({
    x: frame.x,
    vy: frame.vy,
    grounded: frame.grounded,
    grinding,
    slope: resolveRunnerSlope(zone, frame),
    curl
  });
  const { runnerRadius } = SCHLONIC_WORLD;
  const tumble = bail === null ? 0 : -360 * smooth(bail / TUMBLE_UNTIL);
  const bailTuck = bail === null ? 0 : 1 - clamp01((bail - TUMBLE_UNTIL) / UNTUCK_OVER);
  const onBoard = bail === null ? 1 : smooth((bail - STEP_ON_FROM) / STEP_ON_OVER);
  const drop = grinding ? GRIND_DROP : 0;
  const tilt = grinding ? ` rotate(${GRIND_TILT} ${BACK_TRUCK_X} ${runnerRadius - GRIND_DROP})` : "";
  const riderBase = `translate(${screenX} ${frame.y - pose.bob + sink + drop}) rotate(${pose.angle + tumble})${tilt}`;
  const feetY = runnerRadius - BOARD_LIFT * onBoard;
  const isBoardLoose = bail !== null && bail < BOARD_BACK_AT + 0.05;
  const flipShare = pose.flip / 360;
  let board = `translate(${screenX} ${frame.y - pose.bob + sink + drop}) rotate(${pose.angle})${tilt} ${resolveStanceTransform(
    runnerRadius - BOARD_LIFT + Math.sin(flipShare * Math.PI) * FLIP_GAP * RUNNER_SCALE,
    0
  )}`;
  let boardRoll = pose.flip;

  if (isBoardLoose) {
    const run = Math.sin(Math.PI * Math.min(1, bail / BOARD_BACK_AT)) * BAIL_BOARD_RUN;
    const pop = Math.sin(Math.PI * clamp01(bail / 0.3)) * BAIL_BOARD_POP;
    const wobble = Math.sin(bail * Math.PI * 6) * 18 * (1 - clamp01(bail / 0.5));

    board = resolveLooseBoardTransform(
      screenX + run,
      resolveRestY(zone, frame.x + run) - pop,
      slopeDegrees(zone, frame.x + run) + wobble
    );
    boardRoll = 720 * (1 - (1 - clamp01(bail / 0.4)) ** 2);
  }

  return {
    pose,
    bail,
    grinding,
    hen: riderBase,
    stance: resolveStanceTransform(feetY, Math.max(pose.tuck, bailTuck)),
    board,
    boardRoll,
    sparks: {
      visible: grinding,
      x: screenX + BACK_TRUCK_X,
      y: frame.y + runnerRadius,
      seed: Math.floor(frame.x * 2)
    }
  };
};
