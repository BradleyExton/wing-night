import { resolveContraptionSettleIndex } from "@wingnight/shared";
import type {
  ContraptionLayout,
  ContraptionRun,
  ContraptionSegment,
  ContraptionVec2
} from "@wingnight/shared";

/**
 * The lab's own success predicate, deliberately kept OUT of the WN-17 integrator.
 *
 * The integrator models bodies, segments, gravity and keyframes — it has no notion of a goal, and
 * WN-15 wants it that way: it is destined for the server-side reducer, where scoring is the
 * reducer's business, not the physics'. But two of WN-15's four questions ("can the room see *why*
 * a run failed", "one shot vs best-of-N") presuppose a verdict on a run, so the harness has to
 * supply one. It lives here, lab-local and disposable, rather than as a fork of the integrator.
 *
 * The reason codes are the readability question made machine-checkable: if a run's failure cannot
 * be reduced to one of these, the room cannot see why it failed either.
 */

/** The body the room is watching fall; everything else is scenery it can knock around. */
const WING_BODY_ID = "wing";

/** Segments whose id starts with this form the bucket the wing has to end up inside. */
const BUCKET_SEGMENT_PREFIX = "bucket-";

/**
 * Per-keyframe displacement below which a body reads as stopped to someone across a room. Sized
 * against the 100-unit-wide field the layouts use: under this, motion is not visible on a TV.
 */
const SETTLE_EPSILON_UNITS = 0.05;

/**
 * How far above the bucket floor a settled wing has to sit before "it never got down there" is a
 * truer description of the failure than "it missed left/right".
 */
const PERCH_CLEARANCE_UNITS = 6;

export type BucketRegion = {
  readonly minX: number;
  readonly maxX: number;
  /** Layout y of the bucket mouth — the wing counts as inside only once it is below this. */
  readonly topY: number;
  /** Layout y the bucket stands on. y grows downward, so this is its largest y. */
  readonly floorY: number;
};

/**
 * Why the run ended the way it did, in the room's terms rather than the physics':
 * - `landed`   — settled inside the bucket. The only success.
 * - `short`    — settled left of the bucket mouth.
 * - `long`     — settled right of the bucket mouth.
 * - `perched`  — settled well above the bucket floor: hung up on the way down.
 * - `restless` — still moving when the window closed, so the run has no verdict yet. This one is
 *                also the sim-length signal: seeing it means the duration is too short.
 */
export type RunOutcomeReason = "landed" | "short" | "long" | "perched" | "restless";

export type RunOutcome = {
  readonly reason: RunOutcomeReason;
  readonly landed: boolean;
  /** Seconds until every body stopped moving; `null` when the run never settled. */
  readonly settleSeconds: number | null;
  readonly finalWingPosition: ContraptionVec2;
  /** Layout units from the bucket mouth centre: negative is short, positive is long. */
  readonly missX: number;
};

const isBucketSegment = (segment: ContraptionSegment): boolean => {
  return segment.id.startsWith(BUCKET_SEGMENT_PREFIX);
};

export const resolveBucket = (layout: ContraptionLayout): BucketRegion | null => {
  const walls = layout.segments.filter(isBucketSegment);

  if (walls.length === 0) {
    return null;
  }

  const xs = walls.flatMap((wall) => [wall.from.x, wall.to.x]);
  const ys = walls.flatMap((wall) => [wall.from.y, wall.to.y]);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    topY: Math.min(...ys),
    floorY: Math.max(...ys)
  };
};

// Settling moved to @wingnight/shared in WN-23, so the benchmark fixture — which lives in that
// package — can PROVE it settles rather than asserting it. The lab consumes the shared predicate
// instead of keeping a second copy: two settle definitions would drift, and the lab's own need is
// what the shared one was extracted from.
const resolveSettleIndex = (run: ContraptionRun): number | null => {
  return resolveContraptionSettleIndex(run, SETTLE_EPSILON_UNITS);
};

const classify = ({
  bucket,
  position,
  settled
}: {
  bucket: BucketRegion;
  position: ContraptionVec2;
  settled: boolean;
}): RunOutcomeReason => {
  if (!settled) {
    return "restless";
  }

  const insideMouth = position.x > bucket.minX && position.x < bucket.maxX;

  if (insideMouth && position.y > bucket.topY) {
    return "landed";
  }

  if (position.y < bucket.floorY - PERCH_CLEARANCE_UNITS) {
    return "perched";
  }

  return position.x < (bucket.minX + bucket.maxX) / 2 ? "short" : "long";
};

/**
 * Grades one run. Returns `null` when the layout is not gradeable at all — no wing, no bucket, or
 * an empty track — which the caller surfaces rather than papering over as a failed run.
 */
export const resolveRunOutcome = ({
  layout,
  run
}: {
  layout: ContraptionLayout;
  run: ContraptionRun;
}): RunOutcome | null => {
  const bucket = resolveBucket(layout);
  const wingIndex = layout.bodies.findIndex((body) => body.id === WING_BODY_ID);
  const lastKeyframe = run.keyframes[run.keyframes.length - 1];

  if (bucket === null || wingIndex === -1 || lastKeyframe === undefined) {
    return null;
  }

  const finalWingPosition = lastKeyframe[wingIndex];

  if (finalWingPosition === undefined) {
    return null;
  }

  const settleIndex = resolveSettleIndex(run);
  const reason = classify({
    bucket,
    position: finalWingPosition,
    settled: settleIndex !== null
  });

  return {
    reason,
    landed: reason === "landed",
    settleSeconds: settleIndex === null ? null : settleIndex / run.keyframeHz,
    finalWingPosition,
    missX: finalWingPosition.x - (bucket.minX + bucket.maxX) / 2
  };
};
