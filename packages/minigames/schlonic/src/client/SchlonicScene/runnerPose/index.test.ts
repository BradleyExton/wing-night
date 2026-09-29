import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart } from "@wingnight/shared";

import { resolveRunnerCurl, resolveRunnerPose, resolveRunnerSlope } from "./index.js";

const onFoot = { x: 100, grounded: true, slope: 0, curl: 0 };

test("stands the bird level on level ground", () => {
  assert.equal(resolveRunnerPose(onFoot).angle, 0);
  assert.equal(resolveRunnerPose(onFoot).tuck, 0);
});

test("leans the bird into the hill it is running down", () => {
  const downhill = resolveRunnerPose({ ...onFoot, slope: 0.6 }).angle;
  const uphill = resolveRunnerPose({ ...onFoot, slope: -0.6 }).angle;

  assert.ok(downhill > 5, `a downhill barely leaned it: ${downhill}`);
  assert.equal(Math.round(uphill), -Math.round(downhill));
});

test("spins the bird once it is tucked, and keeps spinning as it travels", () => {
  const early = resolveRunnerPose({ x: 100, grounded: false, slope: 0, curl: 1 }).angle;
  const later = resolveRunnerPose({ x: 113, grounded: false, slope: 0, curl: 1 }).angle;

  assert.notEqual(early, later);
  assert.ok(Math.abs(later - early) > 90, "half a stride should be a good part of a turn");
});

test("takes the spin off the distance alone, so two screens agree without talking", () => {
  const input = { x: 412.5, grounded: false, slope: 0.2, curl: 1 };

  assert.deepEqual(resolveRunnerPose(input), resolveRunnerPose(input));
});

test("bounces the step on the ground and never in the air", () => {
  const steps = [0, 3, 6, 9, 12].map((step) => resolveRunnerPose({ ...onFoot, x: 100 + step }).bob);

  assert.ok(Math.max(...steps) > 0.3, "a running bird should have a step in it");
  assert.ok(steps.every((bob) => bob >= 0));
  assert.equal(resolveRunnerPose({ x: 100, grounded: false, slope: 0, curl: 1 }).bob, 0);
});

test("curls towards the ball off the ground and back out on landing", () => {
  assert.ok(resolveRunnerCurl(false, 0) > 0.3);
  assert.ok(resolveRunnerCurl(false, 0.9) > 0.9);
  assert.ok(resolveRunnerCurl(true, 1) < 0.6);
  assert.ok(resolveRunnerCurl(true, 0.1) < 0.1);
});

test("leans with the rail, not the hill under it, while the bird is grinding", () => {
  // A steady downhill, with a level rail over it.
  const zone: SchlonicZone = {
    heights: Array.from({ length: 40 }, (_unused, sample) => SCHLONIC_WORLD.groundBaseY + sample),
    pits: [],
    props: [{ index: 0, kind: "rail", x: 100, toX: 150, y: 50 }],
    goalX: 380
  };
  const running = { ...createSchlonicRunStart(zone), x: 120 };

  assert.ok(resolveRunnerSlope(zone, running) > 0, "the hill had no slope to lean with");
  assert.equal(resolveRunnerSlope(zone, { ...running, grindingRail: 0 }), 0);
});
