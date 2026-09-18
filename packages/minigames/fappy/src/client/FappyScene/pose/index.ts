import type { FappyBird } from "@wingnight/shared";
import { FAPPY_WORLD } from "@wingnight/shared";

// The bird's pose from its physics, and the two beats the scene plays that
// the sim knows nothing about: pure numbers, so the renderer's frame loop
// stays a handful of attribute writes and the maths is testable on its own.

// Nose up on a flap, nose down as it falls; capped so a crash reads as a
// dive, not a cartwheel.
const TILT_PER_VELOCITY = 14;
const TILT_MIN = -28;
const TILT_MAX = 70;

export const resolveTilt = (vy: number): number => {
  return Math.min(TILT_MAX, Math.max(TILT_MIN, vy * TILT_PER_VELOCITY));
};

// One wingbeat per tap, read straight off the physics: a flap SETS `vy` to
// `flapVelocity` and gravity adds a fixed amount a tick, so the ticks since
// the last flap are in the velocity. The wing snaps down through the power
// stroke, recovers up past neutral and settles spread; a bird that has been
// falling a while glides with its wing out, and one standing still folds it.
const STROKE_DOWN_TICKS = 2;
const STROKE_UP_TICKS = 8;
const STROKE_SETTLE_TICKS = 14;
const WING_DOWN_DEGREES = 26;
const WING_UP_DEGREES = -24;
const WING_GLIDE_DEGREES = 5;

export const resolveTicksSinceFlap = (vy: number): number => {
  return (vy - FAPPY_WORLD.flapVelocity) / FAPPY_WORLD.gravity;
};

export const resolveWingAngle = (bird: FappyBird): number => {
  if (bird.vy === 0) {
    return 0;
  }

  const since = resolveTicksSinceFlap(bird.vy);

  if (since < 0) {
    return WING_GLIDE_DEGREES;
  }

  if (since < STROKE_DOWN_TICKS) {
    return (WING_DOWN_DEGREES * since) / STROKE_DOWN_TICKS;
  }

  if (since < STROKE_UP_TICKS) {
    const t = (since - STROKE_DOWN_TICKS) / (STROKE_UP_TICKS - STROKE_DOWN_TICKS);

    return WING_DOWN_DEGREES + (WING_UP_DEGREES - WING_DOWN_DEGREES) * t;
  }

  if (since < STROKE_SETTLE_TICKS) {
    const t = (since - STROKE_UP_TICKS) / (STROKE_SETTLE_TICKS - STROKE_UP_TICKS);

    return WING_UP_DEGREES + (WING_GLIDE_DEGREES - WING_UP_DEGREES) * t;
  }

  return WING_GLIDE_DEGREES;
};

export type HandoffPose = {
  // How high the waiting bird is off the plateau, in world units.
  waiterHop: number;
  // How much of its step aside the waiter has taken (0 → 1 over the first
  // hop), for a landing that came down close to it.
  waiterShift: number;
  // The waiter's wing, raised on the way up.
  waiterWingAngle: number;
  // The landed bird squashes on touchdown and springs back.
  landedScaleY: number;
  puffOpacity: number;
  puffScale: number;
};

const HOPS_PER_HANDOFF = 2;
const HOP_HEIGHT = 5;

// The handoff beat over `progress` 0 → 1: the bird that just landed squashes
// and settles while the one waiting for the tablet hops twice, wing up, and a
// puff of sand goes up where the landing hit.
export const resolveHandoffPose = (progress: number): HandoffPose => {
  const p = Math.min(1, Math.max(0, progress));
  const hopPhase = (p * HOPS_PER_HANDOFF) % 1;
  // `+ 0` folds the -0 a sine leaves at the end of a hop into a plain 0.
  const hop = p >= 0.95 ? 0 : HOP_HEIGHT * Math.sin(hopPhase * Math.PI) + 0;
  const squash = p < 0.3 ? 1 - 0.18 * Math.sin((p / 0.3) * Math.PI) : 1;

  const firstHop = Math.min(1, p * HOPS_PER_HANDOFF);

  return {
    waiterHop: hop,
    waiterShift: firstHop * firstHop * (3 - 2 * firstHop),
    waiterWingAngle: -30 * (hop / HOP_HEIGHT) + 0,
    landedScaleY: squash,
    puffOpacity: Math.max(0, 1 - p * 2.2),
    puffScale: 0.5 + p * 1.8
  };
};

export type CrashPose = {
  // Extra nose-down on top of the tilt, so the bird goes over.
  extraTilt: number;
  // How far the bird sinks where it hit, in world units.
  sink: number;
  // A sideways kick on the whole scene that dies out over the beat.
  shake: number;
  puffOpacity: number;
  puffScale: number;
};

const CRASH_TUMBLE_DEGREES = 75;
const CRASH_SINK_UNITS = 2.5;
const CRASH_SHAKE_UNITS = 1.4;

export const resolveCrashPose = (progress: number): CrashPose => {
  const p = Math.min(1, Math.max(0, progress));
  const ease = 1 - (1 - p) * (1 - p);

  return {
    extraTilt: CRASH_TUMBLE_DEGREES * ease,
    sink: CRASH_SINK_UNITS * ease,
    shake: CRASH_SHAKE_UNITS * (1 - p) * Math.sin(p * 36) + 0,
    puffOpacity: Math.max(0, 1 - p * 1.6),
    puffScale: 0.6 + p * 2
  };
};
