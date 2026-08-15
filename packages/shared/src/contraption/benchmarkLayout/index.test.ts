import assert from "node:assert/strict";
import test from "node:test";

import { resolveSettleIndex } from "../resolveSettleIndex/index.js";
import { simulate } from "../simulate/index.js";
import { BENCHMARK_LAYOUT } from "./index.js";

/** The exact parameters the byte figures are measured at, so this test grades the measured run. */
const BYTE_MEASURE_OPTIONS = {
  seed: 1234,
  durationSeconds: 4,
  stepHz: 240,
  keyframeHz: 30
} as const;

/**
 * WN-23 AC-9. Before the Coulomb fix this fixture NEVER settled — the five marbles crept forever
 * under the flat per-step multiplier, so `resolveSettleIndex` returned null and the fixture could
 * not reach a verdict at all. WN-24 assumes "the benchmark preset now reaches a verdict"; this is
 * the assertion that makes that true rather than hoped.
 *
 * It is a genuine red-before/green-after gate on the physics change, not a tautology: run against
 * the pre-WN-23 resolver it returns null and fails.
 */
test("settles the benchmark layout within the run the byte figures are measured over", () => {
  const run = simulate(BENCHMARK_LAYOUT, BYTE_MEASURE_OPTIONS);

  const settleIndex = resolveSettleIndex(run);

  assert.notEqual(settleIndex, null, "benchmark layout never settles — the fixture has no verdict");
});

// The settle has to land INSIDE the measured window with room to spare, or the fixture is only
// nominally settling — a run that stops on its last frame tells WN-15 nothing about how long a
// watchable run needs to be.
test("settles the benchmark layout well before the run ends", () => {
  const run = simulate(BENCHMARK_LAYOUT, BYTE_MEASURE_OPTIONS);

  const settleIndex = resolveSettleIndex(run);
  const settleSeconds = settleIndex === null ? Infinity : settleIndex / BYTE_MEASURE_OPTIONS.keyframeHz;

  assert.ok(
    settleSeconds < BYTE_MEASURE_OPTIONS.durationSeconds / 2,
    `expected the benchmark to settle in the first half of the run, settled at ${settleSeconds}s`
  );
});

// Guards the AC-9 re-tune against being silently reverted to the pre-WN-23 values, whose meaning
// inverted: `slip` is now a Coulomb coefficient, so 0.86/0.9 would read as "very grippy" rather
// than the "nearly frictionless" they were authored as.
test("carries consciously re-chosen friction coefficients rather than the pre-Coulomb values", () => {
  const slips = BENCHMARK_LAYOUT.bodies.map((body) => body.slip);

  assert.ok(!slips.includes(0.86));
  assert.ok(!slips.includes(0.9));
});
