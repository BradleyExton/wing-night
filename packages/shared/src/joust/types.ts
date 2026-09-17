/**
 * JOUST's physics vocabulary: the arena a team shoots across, the bodies that fly and wobble in
 * it, and the keyframe track one shot produces. Free of any minigame, transport or rendering
 * concern — the integrator that consumes these types runs in the server-side reducer, so a shot
 * is a pure function of arena + aim + seed and the display only ever projects the track.
 */

export type JoustVec2 = {
  x: number;
  y: number;
};

/**
 * An immovable rectangle in world units, top-left anchored. The sample packs draw these as
 * cacti, but the physics only sees four segments.
 */
export type JoustObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Everything content-authored about one arena: where the champ stands, what's in the way. */
export type JoustArena = {
  readonly targetX: number;
  readonly obstacles: readonly JoustObstacle[];
};

/**
 * The pull on the slingshot, as a fraction of the pull radius: `{ x: -1, y: 0 }` is a full
 * pull straight back, and the shot flies in the opposite direction. Magnitude is clamped to 1.
 */
export type JoustAim = {
  x: number;
  y: number;
};

/**
 * What each body in a frame IS, so a renderer can draw a shaft, a head or a ball at that index
 * without the track carrying any of it. The order is fixed by `JOUST_BODIES` in `world/`.
 */
export type JoustBodyKind =
  | "shooter-shaft"
  | "shooter-head"
  | "shooter-ball"
  | "champ-shaft"
  | "champ-head"
  | "champ-ball";

export type JoustBodyDescriptor = {
  readonly kind: JoustBodyKind;
  readonly radius: number;
};

/** Where the shooter first touched the champ. `null` on a track means it never did. */
export type JoustHitZone = "head" | "shaft" | "balls";

/**
 * Every body's centre at one sampled instant, flattened to `[x0, y0, x1, y1, ...]` in
 * `JOUST_BODIES` order and rounded to two decimals — a whole shot rides in the room snapshot,
 * so the encoding is deliberately the leanest JSON can carry.
 */
export type JoustFrame = readonly number[];

export type JoustShotRun = {
  readonly keyframeHz: number;
  readonly keyframes: readonly JoustFrame[];
  readonly hitZone: JoustHitZone | null;
  /** Index into `keyframes` of the first frame at or after the hit, for the renderer's flash. */
  readonly hitFrameIndex: number | null;
};

export type JoustSimulateOptions = {
  /** Drives the sub-unit jitter that keeps a perfectly aligned shot off a knife edge. */
  readonly seed: number;
  /** The longest a shot is allowed to run before the track is cut, in seconds. */
  readonly maxDurationSeconds: number;
  /** Integration steps per second. Must be a whole multiple of `keyframeHz`. */
  readonly stepHz: number;
  /** Keyframes emitted per second — the rate the replay track is sized for. */
  readonly keyframeHz: number;
};
