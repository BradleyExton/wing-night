/**
 * JOUST's physics vocabulary: the lane a team shoots down, the bodies that fly and topple in it,
 * and the keyframe track one shot produces. Free of any minigame, transport or rendering concern —
 * the integrator that consumes these types runs in the server-side reducer, so a shot is a pure
 * function of lane + aim + seed and the display only ever projects the track.
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

/**
 * A shelf players stand on, anchored by its LEFT edge at `x` and by the surface they stand on at
 * `y`. A perch at floor level is the sand itself and builds nothing; any higher one grows its own
 * slab and legs, so an author cannot draw a platform and forget to make it solid.
 */
export type JoustPerch = {
  x: number;
  y: number;
  width: number;
};

/**
 * Everything the integrator needs about one lane: where each standing pin is planted, the
 * structures they are planted on, and what else is in the way. `pinFeet` is already the STANDING
 * set — a player felled earlier in the turn is absent from it, and the survivors keep the spots
 * they started on. `collapsedPerchIndices` are the towers an earlier shot already brought down:
 * they are rubble now, so nothing is built or simulated for them.
 */
export type JoustArena = {
  readonly pinFeet: readonly JoustVec2[];
  readonly perches: readonly JoustPerch[];
  readonly obstacles: readonly JoustObstacle[];
  readonly collapsedPerchIndices?: readonly number[];
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
 * What each body in a frame IS, so a renderer can draw a shaft, a head or a pin at that index
 * without the track carrying any of it. The order is fixed by `resolveJoustBodies` in `world/`.
 */
export type JoustBodyKind =
  | "shooter-shaft"
  | "shooter-head"
  | "shooter-ball"
  | "pin-foot"
  | "pin-head"
  | "leg-foot"
  | "leg-top";

export type JoustBodyDescriptor = {
  readonly kind: JoustBodyKind;
  readonly radius: number;
};

/**
 * One pin going over: which column it stood in, and the keyframe it passed the point of no
 * return on. The renderer bursts on that frame; the reducer only counts the entries.
 */
export type JoustTopple = {
  readonly pinIndex: number;
  readonly frameIndex: number;
};

/**
 * One tower giving way: which perch it held up, and the keyframe its legs folded on. Everyone
 * stood on it is dropped — and counted — on that same frame.
 */
export type JoustCollapse = {
  readonly perchIndex: number;
  readonly frameIndex: number;
};

/**
 * Every body's centre at one sampled instant, flattened to `[x0, y0, x1, y1, ...]` in
 * `resolveJoustBodies` order and rounded to two decimals — a whole shot rides in the room
 * snapshot, so the encoding is deliberately the leanest JSON can carry.
 */
export type JoustFrame = readonly number[];

export type JoustShotRun = {
  readonly keyframeHz: number;
  readonly keyframes: readonly JoustFrame[];
  /** In the order they went down, so a display can read out the carnage as it happens. */
  readonly topples: readonly JoustTopple[];
  /** Every tower the shot brought down, in the order they fell. */
  readonly collapses: readonly JoustCollapse[];
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
