import assert from "node:assert/strict";
import test from "node:test";

import { BENCHMARK_LAYOUT } from "../benchmarkLayout/index.js";
import { simulate } from "../simulate/index.js";
import type { Run } from "../types.js";
import { measureTrackBytes } from "./index.js";

const measureBenchmark = (keyframeHz: number): ReturnType<typeof measureTrackBytes> => {
  return measureTrackBytes(
    simulate(BENCHMARK_LAYOUT, {
      seed: 1234,
      durationSeconds: 4,
      stepHz: 240,
      keyframeHz
    })
  );
};

const emptyRun: Run = { keyframeHz: 30, keyframes: [] };

test("reports the layout's body count and the track's own frame count", () => {
  const measured = measureBenchmark(30);

  assert.equal(measured.bodyCount, BENCHMARK_LAYOUT.bodies.length);
  assert.equal(measured.keyframeCount, 4 * 30 + 1);
});

test("reports zero bodies when the track has no keyframes", () => {
  const measured = measureTrackBytes(emptyRun);

  assert.equal(measured.bodyCount, 0);
  assert.equal(measured.packedFloat32Bytes, 0);
});

test("counts UTF-8 bytes of the serialized payload rather than string length", () => {
  const measured = measureTrackBytes({
    keyframeHz: 1,
    keyframes: [[{ x: 1, y: 2 }]]
  });

  assert.equal(
    measured.jsonObjectBytes,
    JSON.stringify({ keyframeHz: 1, keyframes: [[{ x: 1, y: 2 }]] }).length
  );
});

// These lock the exact figures recorded in WN-17's `## Evidence`. They are characterization
// values read off the integrator, not independently derived — so a red here does not mean the
// physics is wrong, it means the published byte counts are stale and must be re-recorded before
// WN-15 leans on them.
test("holds the recorded 30fps evidence figures for the benchmark layout", () => {
  assert.deepEqual(measureBenchmark(30), {
    keyframeHz: 30,
    bodyCount: 6,
    keyframeCount: 121,
    jsonObjectBytes: 33978,
    jsonFlatRoundedBytes: 8610,
    packedFloat32Bytes: 5808
  });
});

test("holds the recorded 20fps evidence figures for the benchmark layout", () => {
  assert.deepEqual(measureBenchmark(20), {
    keyframeHz: 20,
    bodyCount: 6,
    keyframeCount: 81,
    jsonObjectBytes: 22759,
    jsonFlatRoundedBytes: 5770,
    packedFloat32Bytes: 3888
  });
});
