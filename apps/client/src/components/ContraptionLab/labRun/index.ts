import {
  measureContraptionTrackBytes,
  simulateContraption,
  type ContraptionLayout,
  type ContraptionRun,
  type ContraptionTrackBytes
} from "@wingnight/shared";

import { resolvePieceSet } from "../pieceSets/index";
import { resolveRunOutcome, type RunOutcome } from "../runOutcome/index";

/**
 * Everything one turn of the lab produces: N attempts at the same build, each graded and weighed.
 *
 * This is where WN-15's one-shot-vs-best-of-N question gets its instrument, and the instrument had
 * to be built around a finding. Re-running a layout under a different SEED does not produce a
 * different run: the integrator's symmetry-breaking jitter is 0.0005 layout units and the system is
 * heavily damped rather than chaotic, so five seeds of one build land within 1e-4 of each other.
 * "Best of three" therefore cannot mean "press go three times" — there is nothing to win. So the
 * lab offers both readings side by side and lets the room see the difference:
 *
 * - `seed`    — same build, new seed. Expected to look identical; that IS the finding.
 * - `rebuild` — the team moves one piece between attempts. The only version with real variance.
 */

/** The integrator always steps here; `keyframeHz` only chooses how often the track is sampled. */
const STEP_HZ = 240;

/** How far a `rebuild` attempt shifts the last placed ramp — about a quarter of the wing's width. */
const NUDGE_UNITS = 0.6;

const RAMP_ID_PREFIX = "ramp-";

export type AttemptVariation = "seed" | "rebuild";

export type LabAttempt = {
  readonly index: number;
  readonly label: string;
  readonly layout: ContraptionLayout;
  readonly run: ContraptionRun;
  /** `null` when the layout is not gradeable — no wing or no bucket. */
  readonly outcome: RunOutcome | null;
  readonly bytes: ContraptionTrackBytes;
};

export type LabRunSettings = {
  readonly pieceSetId: string;
  readonly attempts: number;
  readonly variation: AttemptVariation;
  readonly seed: number;
  readonly durationSeconds: number;
  readonly keyframeHz: number;
};

/**
 * Shifts the last placed ramp sideways — the smallest edit that counts as "the team rebuilt".
 * Frame segments are left alone, so a nudge never moves the bucket out from under the wing.
 */
const nudgeLastRamp = (layout: ContraptionLayout, offsetX: number): ContraptionLayout => {
  if (offsetX === 0) {
    return layout;
  }

  const lastRampIndex = layout.segments.reduce((found, segment, index) => {
    return segment.id.startsWith(RAMP_ID_PREFIX) ? index : found;
  }, -1);

  if (lastRampIndex === -1) {
    return layout;
  }

  return {
    ...layout,
    segments: layout.segments.map((segment, index) => {
      if (index !== lastRampIndex) {
        return segment;
      }

      return {
        ...segment,
        from: { x: segment.from.x + offsetX, y: segment.from.y },
        to: { x: segment.to.x + offsetX, y: segment.to.y }
      };
    })
  };
};

export const buildLabAttempts = (settings: LabRunSettings): readonly LabAttempt[] => {
  const pieceSet = resolvePieceSet(settings.pieceSetId);

  return Array.from({ length: settings.attempts }, (_unused, index): LabAttempt => {
    const isRebuild = settings.variation === "rebuild";
    const layout = isRebuild
      ? nudgeLastRamp(pieceSet.layout, index * NUDGE_UNITS)
      : pieceSet.layout;
    const run = simulateContraption(layout, {
      seed: settings.seed + index,
      durationSeconds: settings.durationSeconds,
      stepHz: STEP_HZ,
      keyframeHz: settings.keyframeHz
    });

    return {
      index,
      label: `Attempt ${index + 1}`,
      layout,
      run,
      outcome: resolveRunOutcome({ layout, run }),
      bytes: measureContraptionTrackBytes(run)
    };
  });
};

/**
 * The best-of-N winner: a landing beats any miss, and among equals the one that finished nearest
 * the bucket centre wins. Returns `null` only when there are no attempts at all.
 */
export const bestAttempt = (attempts: readonly LabAttempt[]): LabAttempt | null => {
  return attempts.reduce<LabAttempt | null>((best, attempt) => {
    if (best === null) {
      return attempt;
    }

    const bestLanded = best.outcome?.landed === true;
    const attemptLanded = attempt.outcome?.landed === true;

    if (attemptLanded !== bestLanded) {
      return attemptLanded ? attempt : best;
    }

    const bestMiss = Math.abs(best.outcome?.missX ?? Number.POSITIVE_INFINITY);
    const attemptMiss = Math.abs(attempt.outcome?.missX ?? Number.POSITIVE_INFINITY);

    return attemptMiss < bestMiss ? attempt : best;
  }, null);
};

/**
 * A tenth of a layout unit on a 100-unit field. Below this, two runs are the same run as far as
 * anyone watching a TV is concerned.
 */
const VISIBLE_DIVERGENCE_UNITS = 0.1;

/**
 * Whether N attempts actually differ. The lab shows this verdict directly, because "they were all
 * the same run" is the answer to the best-of-N question rather than a bug in the harness.
 *
 * Compares whole TRACKS, not final positions: two attempts that both land settle in the same spot
 * at the bottom of the same bucket, so an endpoint comparison would call a visibly different route
 * identical. What the room watches is the path.
 */
export const attemptsDiffer = (attempts: readonly LabAttempt[]): boolean => {
  const [first] = attempts;

  if (first === undefined) {
    return false;
  }

  return attempts.some((attempt) => {
    return attempt.run.keyframes.some((keyframe, keyframeIndex) => {
      const reference = first.run.keyframes[keyframeIndex];

      if (reference === undefined) {
        return false;
      }

      return keyframe.some((position, bodyIndex) => {
        const referencePosition = reference[bodyIndex];

        if (referencePosition === undefined) {
          return false;
        }

        return (
          Math.abs(position.x - referencePosition.x) > VISIBLE_DIVERGENCE_UNITS ||
          Math.abs(position.y - referencePosition.y) > VISIBLE_DIVERGENCE_UNITS
        );
      });
    });
  });
};
