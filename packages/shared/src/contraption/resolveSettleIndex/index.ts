import type { Run, Vec2 } from "../types.js";

/**
 * Whether and when a run stops moving.
 *
 * Extracted from the WN-18 lab (`ContraptionLab/runOutcome`) into the integrator's own package by
 * WN-23, because the fixture whose settling has to be PROVEN — `CONTRAPTION_BENCHMARK_LAYOUT` —
 * lives here, and a settle claim with its only predicate in `apps/client` had no runnable check in
 * the package that owns the claim.
 *
 * Deliberately goal-agnostic: it answers "did motion stop", nothing about whether a run succeeded.
 * Outcome classification (landed / perched / missed) stays lab-local, because the integrator is
 * destined for the server-side reducer where scoring is the reducer's business, not the physics'.
 */

/**
 * Per-keyframe displacement below which a body reads as stopped to someone across a room. Sized
 * against the 100-unit-wide field the layouts use: under this, motion is not visible on a TV.
 */
export const SETTLE_EPSILON_UNITS = 0.05;

/** The largest distance any body moved between two sampled frames. */
export const maxDisplacement = (
  before: readonly Vec2[],
  after: readonly Vec2[]
): number => {
  return after.reduce((largest, position, index) => {
    const previous = before[index];

    if (previous === undefined) {
      return largest;
    }

    const deltaX = position.x - previous.x;
    const deltaY = position.y - previous.y;

    return Math.max(largest, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
  }, 0);
};

/**
 * The keyframe index after which nothing moves again — found by walking backwards to the LAST
 * frame carrying motion, so a body that stalls mid-run and then gets knocked loose still reports
 * the later settle. Motion in the final frame means the run never settled at all, which is
 * reported as `null` rather than as the final index.
 */
export const resolveSettleIndex = (
  run: Run,
  epsilonUnits: number = SETTLE_EPSILON_UNITS
): number | null => {
  const { keyframes } = run;

  for (let index = keyframes.length - 1; index > 0; index -= 1) {
    if (maxDisplacement(keyframes[index - 1], keyframes[index]) > epsilonUnits) {
      return index === keyframes.length - 1 ? null : index;
    }
  }

  return 0;
};
