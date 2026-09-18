import {
  resolveContraptionSettleIndex,
  simulateContraption,
  type ContraptionKeyframe,
  type ContraptionLayout,
  type ContraptionLevel,
  type ContraptionPlacedPiece,
  type ContraptionRun,
  type ContraptionRunOutcome,
  type ContraptionRunTrack,
  type ContraptionSegment,
  type ContraptionVec2
} from "@wingnight/shared";

import { buildLayout, FLOOR_Y, PIECE_SEGMENT_ID_PREFIX } from "../geometry/index.js";
import {
  PICKUP_COLLECT_RADIUS,
  SIM_DURATION_SECONDS,
  SIM_KEYFRAME_HZ,
  SIM_STEP_HZ,
  WING_RADIUS
} from "../types/index.js";

// The verdict on one run, in the room's terms. The integrator has no notion of
// a goal on purpose — scoring is the reducer's business — so this is where the
// bucket, the pickups and the outcome codes live.

export type GradedRun = {
  track: ContraptionRunTrack;
  outcome: ContraptionRunOutcome;
  settleSeconds: number | null;
  collectedPickupIds: string[];
  // Level points before the reducer applies the pointsMax cap.
  points: number;
  // Every placed piece the wing physically touched, checked at the
  // integration rate. A piece the wing never meets is scenery; the sample
  // levels' solutions are pinned to contact every piece they spend.
  contactedPieceIds: string[];
};

// How far above the bucket floor a settled wing has to sit before "it never
// got down there" is a truer description than "it missed left/right".
const PERCH_CLEARANCE_UNITS = 6;

// Within a hair of the surface. Sampled at the integration rate, because a
// fast wing clears a ramp between two display keyframes.
const CONTACT_SLACK_UNITS = 0.05;

const TRACK_ROUNDING_FACTOR = 100;

const roundForTrack = (value: number): number => {
  return Math.round(value * TRACK_ROUNDING_FACTOR) / TRACK_ROUNDING_FACTOR;
};

const distanceToSegment = (point: ContraptionVec2, segment: ContraptionSegment): number => {
  const alongX = segment.to.x - segment.from.x;
  const alongY = segment.to.y - segment.from.y;
  const lengthSquared = alongX * alongX + alongY * alongY;
  const offsetX = point.x - segment.from.x;
  const offsetY = point.y - segment.from.y;
  const travel =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (offsetX * alongX + offsetY * alongY) / lengthSquared));
  const gapX = point.x - (segment.from.x + alongX * travel);
  const gapY = point.y - (segment.from.y + alongY * travel);

  return Math.sqrt(gapX * gapX + gapY * gapY);
};

const distanceBetween = (left: ContraptionVec2, right: ContraptionVec2): number => {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

// The display replays at SIM_KEYFRAME_HZ; the physics ran at SIM_STEP_HZ. The
// two rates are whole multiples by construction (the integrator asserts it),
// so sampling every Nth step is exact.
const downsampleKeyframes = (
  keyframes: readonly ContraptionKeyframe[],
  stepHz: number,
  keyframeHz: number
): ContraptionKeyframe[] => {
  const stride = stepHz / keyframeHz;

  return keyframes.filter((_keyframe, index) => index % stride === 0);
};

const wingPositions = (keyframes: readonly ContraptionKeyframe[]): ContraptionVec2[] => {
  return keyframes.map((keyframe) => keyframe[0] ?? { x: 0, y: 0 });
};

export const encodeTrack = (
  positions: readonly ContraptionVec2[],
  keyframeHz: number
): ContraptionRunTrack => {
  const flat: number[] = [];

  for (const position of positions) {
    flat.push(roundForTrack(position.x), roundForTrack(position.y));
  }

  return { keyframeHz, positions: flat };
};

export const decodeTrack = (track: ContraptionRunTrack): ContraptionVec2[] => {
  const positions: ContraptionVec2[] = [];

  for (let index = 0; index + 1 < track.positions.length; index += 2) {
    positions.push({
      x: track.positions[index] as number,
      y: track.positions[index + 1] as number
    });
  }

  return positions;
};

type BucketRegion = {
  minX: number;
  maxX: number;
  topY: number;
  floorY: number;
};

const resolveBucketRegion = (level: ContraptionLevel): BucketRegion => {
  return {
    minX: level.bucket.x,
    maxX: level.bucket.x + level.bucket.width,
    topY: FLOOR_Y - level.bucket.height,
    floorY: FLOOR_Y
  };
};

export const classifyOutcome = (
  bucket: BucketRegion,
  finalPosition: ContraptionVec2,
  settled: boolean
): ContraptionRunOutcome => {
  if (!settled) {
    return "restless";
  }

  const insideMouth = finalPosition.x > bucket.minX && finalPosition.x < bucket.maxX;

  if (insideMouth && finalPosition.y > bucket.topY) {
    return "landed";
  }

  if (finalPosition.y < bucket.floorY - PERCH_CLEARANCE_UNITS) {
    return "perched";
  }

  return finalPosition.x < (bucket.minX + bucket.maxX) / 2 ? "short" : "long";
};

const resolveCollectedPickupIds = (
  level: ContraptionLevel,
  stepPositions: readonly ContraptionVec2[]
): string[] => {
  return (level.pickups ?? [])
    .filter((pickup) => {
      return stepPositions.some(
        (position) => distanceBetween(position, pickup) <= PICKUP_COLLECT_RADIUS
      );
    })
    .map((pickup) => pickup.id);
};

const resolveContactedPieceIds = (
  layout: ContraptionLayout,
  stepPositions: readonly ContraptionVec2[]
): string[] => {
  return layout.segments
    .filter((segment) => segment.id.startsWith(PIECE_SEGMENT_ID_PREFIX))
    .filter((segment) => {
      return stepPositions.some(
        (position) => distanceToSegment(position, segment) <= WING_RADIUS + CONTACT_SLACK_UNITS
      );
    })
    .map((segment) => segment.id);
};

export const simulateLevel = (
  level: ContraptionLevel,
  pieces: readonly ContraptionPlacedPiece[],
  seed: number
): { layout: ContraptionLayout; stepRun: ContraptionRun } => {
  const layout = buildLayout(level, pieces);
  const stepRun = simulateContraption(layout, {
    seed,
    durationSeconds: SIM_DURATION_SECONDS,
    stepHz: SIM_STEP_HZ,
    keyframeHz: SIM_STEP_HZ
  });

  return { layout, stepRun };
};

// One attempt, start to verdict. Pure: the same level, pieces and seed grade
// the same way every time, which is what lets a reducer test assert that a
// known-good build lands.
export const gradeAttempt = (
  level: ContraptionLevel,
  pieces: readonly ContraptionPlacedPiece[],
  seed: number
): GradedRun => {
  const { layout, stepRun } = simulateLevel(level, pieces, seed);
  const stepPositions = wingPositions(stepRun.keyframes);
  const displayKeyframes = downsampleKeyframes(
    stepRun.keyframes,
    SIM_STEP_HZ,
    SIM_KEYFRAME_HZ
  );
  const displayRun: ContraptionRun = {
    keyframeHz: SIM_KEYFRAME_HZ,
    keyframes: displayKeyframes
  };
  const settleIndex = resolveContraptionSettleIndex(displayRun);
  const finalPosition = stepPositions[stepPositions.length - 1] ?? { x: 0, y: 0 };
  const outcome = classifyOutcome(
    resolveBucketRegion(level),
    finalPosition,
    settleIndex !== null
  );
  const collectedPickupIds = resolveCollectedPickupIds(level, stepPositions);
  const pickupPoints = (level.pickups ?? [])
    .filter((pickup) => collectedPickupIds.includes(pickup.id))
    .reduce((total, pickup) => total + pickup.points, 0);

  return {
    track: encodeTrack(wingPositions(displayKeyframes), SIM_KEYFRAME_HZ),
    outcome,
    settleSeconds: settleIndex === null ? null : settleIndex / SIM_KEYFRAME_HZ,
    collectedPickupIds,
    points: (outcome === "landed" ? level.pointsLanded : 0) + pickupPoints,
    contactedPieceIds: resolveContactedPieceIds(layout, stepPositions)
  };
};
