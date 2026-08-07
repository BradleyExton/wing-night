import type { Keyframe, Layout, Run, SimulateOptions, Vec2 } from "../types.js";
import type { BodyStep } from "./resolveSegmentContacts/index.js";
import { resolveSegmentContacts } from "./resolveSegmentContacts/index.js";

/**
 * Half a thousandth of a layout unit. A perfectly symmetric build — a ball centred exactly on a
 * segment endpoint — otherwise resolves into a degenerate, unwatchable run; the seed nudges every
 * body off that knife edge reproducibly.
 */
const JITTER_UNITS = 0.0005;

const DEFAULT_SEED_STATE = 0x9e3779b9 | 0;

const UINT32_RANGE = 4294967296;

/**
 * xorshift32 — integer operations only, so every engine implementing ES2022 bit operators yields
 * the identical stream. The platform PRNG is excluded from this module for the opposite reason:
 * it is not reproducible at all.
 */
const nextSeedState = (state: number): number => {
  let next = state | 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next | 0;
};

/** xorshift32 is absorbing at zero, so a zero seed borrows a fixed non-zero state instead. */
const seedStateFrom = (seed: number): number => {
  const truncated = seed | 0;
  return truncated === 0 ? DEFAULT_SEED_STATE : truncated;
};

const unitFromState = (state: number): number => {
  return (state >>> 0) / UINT32_RANGE;
};

const assertOptions = (options: SimulateOptions): void => {
  if (!Number.isFinite(options.seed)) {
    throw new RangeError("simulate: seed must be a finite number");
  }
  if (!(options.durationSeconds > 0) || !Number.isFinite(options.durationSeconds)) {
    throw new RangeError("simulate: durationSeconds must be a positive finite number");
  }
  if (!Number.isInteger(options.stepHz) || options.stepHz <= 0) {
    throw new RangeError("simulate: stepHz must be a positive integer");
  }
  if (!Number.isInteger(options.keyframeHz) || options.keyframeHz <= 0) {
    throw new RangeError("simulate: keyframeHz must be a positive integer");
  }
  if (options.stepHz % options.keyframeHz !== 0) {
    throw new RangeError(
      `simulate: stepHz (${options.stepHz}) must be a whole multiple of keyframeHz (${options.keyframeHz})`
    );
  }
};

const toKeyframe = (steps: readonly BodyStep[]): Keyframe => {
  return steps.map((step): Vec2 => {
    return { x: step.x, y: step.y };
  });
};

const jitteredStart = (origin: Vec2, offsetX: number, offsetY: number): BodyStep => {
  const x = origin.x + offsetX;
  const y = origin.y + offsetY;
  return { x, y, previousX: x, previousY: y };
};

const advance = (
  step: BodyStep,
  gravityStepX: number,
  gravityStepY: number
): BodyStep => {
  return {
    x: step.x + (step.x - step.previousX) + gravityStepX,
    y: step.y + (step.y - step.previousY) + gravityStepY,
    previousX: step.x,
    previousY: step.y
  };
};

/**
 * Runs a contraption to completion and returns the keyframe track a display would replay.
 *
 * Pure and dependency-free by construction: same layout + same seed ⇒ the same track, every time.
 * `keyframeHz` only chooses how often the track is *sampled* — the physics always integrates at
 * `stepHz` — so a 20fps and a 30fps track of one layout describe the identical motion, which is
 * what makes their byte counts comparable.
 */
export const simulate = (layout: Layout, options: SimulateOptions): Run => {
  assertOptions(options);

  const stepSeconds = 1 / options.stepHz;
  const gravityStepX = layout.gravity.x * stepSeconds * stepSeconds;
  const gravityStepY = layout.gravity.y * stepSeconds * stepSeconds;
  const stepsPerKeyframe = options.stepHz / options.keyframeHz;
  const totalSteps = Math.round(options.durationSeconds * options.stepHz);

  let seedState = seedStateFrom(options.seed);
  const steps: BodyStep[] = layout.bodies.map((body): BodyStep => {
    seedState = nextSeedState(seedState);
    const offsetX = (unitFromState(seedState) * 2 - 1) * JITTER_UNITS;
    seedState = nextSeedState(seedState);
    const offsetY = (unitFromState(seedState) * 2 - 1) * JITTER_UNITS;
    return jitteredStart(body.origin, offsetX, offsetY);
  });

  const keyframes: Keyframe[] = [toKeyframe(steps)];
  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
    for (let bodyIndex = 0; bodyIndex < steps.length; bodyIndex += 1) {
      const body = layout.bodies[bodyIndex];
      const moved = advance(steps[bodyIndex], gravityStepX, gravityStepY);
      steps[bodyIndex] = resolveSegmentContacts(
        moved,
        { radius: body.radius, restitution: body.restitution, slip: body.slip },
        layout.segments
      );
    }
    if (stepIndex % stepsPerKeyframe === 0) {
      keyframes.push(toKeyframe(steps));
    }
  }

  return { keyframeHz: options.keyframeHz, keyframes };
};
