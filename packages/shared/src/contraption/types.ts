/**
 * CONTRAPTION's physics vocabulary: the layout a team builds, and the keyframe track one run
 * produces. Deliberately free of any minigame, transport or rendering concern — the integrator
 * that consumes these types is destined for the server-side reducer (WN-15), so a run stays a
 * pure function of layout + seed.
 */

export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

/** A dynamic circle — the only moving body kind the integrator simulates. */
export type CircleBody = {
  readonly id: string;
  /** Centre at rest, before the seed's symmetry-breaking jitter is applied. */
  readonly origin: Vec2;
  readonly radius: number;
  /** Normal velocity retained on contact: 0 lands dead, 1 bounces forever. */
  readonly restitution: number;
  /** Tangential velocity retained on contact: 0 grips, 1 slides frictionlessly. */
  readonly slip: number;
};

/** An immovable line the circles collide against — a ramp, a wall, the floor. */
export type Segment = {
  readonly id: string;
  readonly from: Vec2;
  readonly to: Vec2;
};

export type Layout = {
  readonly bodies: readonly CircleBody[];
  readonly segments: readonly Segment[];
  /** Layout units per second squared. */
  readonly gravity: Vec2;
};

export type SimulateOptions = {
  /** Drives the sub-unit jitter that breaks perfectly symmetric layouts. */
  readonly seed: number;
  readonly durationSeconds: number;
  /** Integration steps per second. Must be a whole multiple of `keyframeHz`. */
  readonly stepHz: number;
  /** Keyframes emitted per second — the rate the replay track is sized for. */
  readonly keyframeHz: number;
};

/** Every body's centre at one sampled instant, in `Layout.bodies` order. */
export type Keyframe = readonly Vec2[];

export type Run = {
  readonly keyframeHz: number;
  readonly keyframes: readonly Keyframe[];
};
