import type { Run } from "../types.js";

/**
 * How heavy one recorded run is on the wire — the number WN-15's architecture call is waiting on
 * (emit a keyframe track and replay it, versus re-simulating on both sides).
 *
 * The two JSON figures are the load-bearing ones: minigame runtime state crosses socket.io as
 * `SerializableValue`, so JSON is the transport that actually applies. The packed figure is a
 * clearly-labelled secondary — it is not a `SerializableValue` and would need a second channel.
 */
export type TrackBytes = {
  readonly keyframeHz: number;
  readonly bodyCount: number;
  readonly keyframeCount: number;
  /** The run serialized exactly as `simulate` returns it: `{x, y}` objects, full precision. */
  readonly jsonObjectBytes: number;
  /** The shape a snapshot would realistically carry: flat `[x, y, …]` per keyframe, 2dp. */
  readonly jsonFlatRoundedBytes: number;
  /** Secondary — the same coordinates packed as float32, for comparison only. */
  readonly packedFloat32Bytes: number;
};

const ROUNDING_FACTOR = 100;

const COORDINATES_PER_BODY = 2;

const utf8Bytes = (value: unknown): number => {
  return new TextEncoder().encode(JSON.stringify(value)).length;
};

const toFlatRounded = (run: Run): number[][] => {
  return run.keyframes.map((keyframe): number[] => {
    const flat: number[] = [];
    for (const point of keyframe) {
      flat.push(Math.round(point.x * ROUNDING_FACTOR) / ROUNDING_FACTOR);
      flat.push(Math.round(point.y * ROUNDING_FACTOR) / ROUNDING_FACTOR);
    }
    return flat;
  });
};

/**
 * Measures a whole run, not one emit: the figures below are what a single ~4s replay costs in
 * total, which is the basis the architecture decision needs.
 */
export const measureTrackBytes = (run: Run): TrackBytes => {
  const bodyCount = run.keyframes.length === 0 ? 0 : run.keyframes[0].length;
  return {
    keyframeHz: run.keyframeHz,
    bodyCount,
    keyframeCount: run.keyframes.length,
    jsonObjectBytes: utf8Bytes(run),
    jsonFlatRoundedBytes: utf8Bytes({
      keyframeHz: run.keyframeHz,
      keyframes: toFlatRounded(run)
    }),
    packedFloat32Bytes:
      run.keyframes.length *
      bodyCount *
      COORDINATES_PER_BODY *
      Float32Array.BYTES_PER_ELEMENT
  };
};
