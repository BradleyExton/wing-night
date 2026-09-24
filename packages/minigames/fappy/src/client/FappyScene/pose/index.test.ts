import assert from "node:assert/strict";
import test from "node:test";
import { FAPPY_WORLD } from "@wingnight/shared";

import {
  GOO_TICKS,
  resolveCrashPose,
  resolveGooOpacity,
  resolveHandoffPose,
  resolveSplatKick,
  resolveTilt,
  resolveWingAngle
} from "./index.js";

test("does tilt nose up on a flap and cap the dive when falling", () => {
  assert.ok(Math.abs(resolveTilt(FAPPY_WORLD.flapVelocity) + 22.4) < 1e-9);
  assert.equal(resolveTilt(-10), -28);
  assert.ok(Math.abs(resolveTilt(FAPPY_WORLD.maxFallVelocity) - 39.2) < 1e-9);
  assert.equal(resolveTilt(10), 70);
});

test("does fold the wing when the bird stands still", () => {
  assert.equal(resolveWingAngle({ y: 50, vy: 0 }), 0);
});

test("does beat the wing down then up over the ticks after a flap when read off the velocity", () => {
  const { flapVelocity, gravity } = FAPPY_WORLD;
  const atTick = (ticks: number): number => resolveWingAngle({ y: 40, vy: flapVelocity + gravity * ticks });

  const near = (actual: number, expected: number): void => {
    assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} is not ${expected}`);
  };

  near(atTick(0), 0);
  near(atTick(2), 26);
  assert.ok(atTick(5) < atTick(2), "recovering up");
  near(atTick(8), -24);
  near(atTick(14), 5);
  near(atTick(30), 5);
});

test("does glide when the velocity is not one a flap could have produced", () => {
  // An eagle's bump sets a fall the flap curve never reaches from above.
  assert.equal(resolveWingAngle({ y: 40, vy: FAPPY_WORLD.flapVelocity - 1 }), 5);
});

test("does hop the waiter twice and settle it back on the plateau by the end of the handoff", () => {
  assert.equal(resolveHandoffPose(0).waiterHop, 0);
  assert.ok(resolveHandoffPose(0.25).waiterHop > 4, "top of the first hop");
  assert.ok(resolveHandoffPose(0.5).waiterHop < 0.001, "between hops");
  assert.ok(resolveHandoffPose(0.75).waiterHop > 4, "top of the second hop");
  assert.equal(resolveHandoffPose(1).waiterHop, 0);
  assert.equal(resolveHandoffPose(1).waiterWingAngle, 0);
});

test("does take the step aside over the first hop and hold it", () => {
  assert.equal(resolveHandoffPose(0).waiterShift, 0);
  assert.ok(resolveHandoffPose(0.25).waiterShift > 0.4 && resolveHandoffPose(0.25).waiterShift < 0.6);
  assert.equal(resolveHandoffPose(0.5).waiterShift, 1);
  assert.equal(resolveHandoffPose(1).waiterShift, 1);
});

test("does squash the landed bird on touchdown and clear the puff before the handoff is over", () => {
  assert.ok(resolveHandoffPose(0.15).landedScaleY < 0.85);
  assert.equal(resolveHandoffPose(0.6).landedScaleY, 1);
  assert.equal(resolveHandoffPose(0).puffOpacity, 1);
  assert.equal(resolveHandoffPose(0.6).puffOpacity, 0);
});

test("does tumble the bird over and let the shake die out across the crash beat", () => {
  assert.equal(resolveCrashPose(0).extraTilt, 0);
  assert.equal(resolveCrashPose(1).extraTilt, 75);
  assert.equal(resolveCrashPose(1).sink, 2.5);
  assert.equal(resolveCrashPose(1).shake, 0);
  assert.ok(Math.abs(resolveCrashPose(0.1).shake) > 0);
  assert.equal(resolveCrashPose(1).puffOpacity, 0);
});

test("does clamp a beat's progress to its ends when the loop overshoots", () => {
  assert.deepEqual(resolveHandoffPose(1.4), resolveHandoffPose(1));
  assert.deepEqual(resolveCrashPose(-0.2), resolveCrashPose(0));
});

test("does drip the goo off the bird after the latest splat and kick the scene as it lands", () => {
  const clean = { tick: 50, bird: { y: 40, vy: 0 }, scrollX: 0, gatesCleared: 0, knockedEagles: [], splats: [], outcome: null };
  const splatted = { ...clean, splats: [{ gate: 0, launchTick: 0, tick: 20 }, { gate: 1, launchTick: 100, tick: 48 }] };

  assert.equal(resolveGooOpacity(clean), 0);
  assert.equal(resolveSplatKick(clean), 0);
  assert.equal(resolveGooOpacity(splatted), 1);
  assert.notEqual(resolveSplatKick(splatted), 0);
  assert.equal(resolveSplatKick({ ...splatted, tick: 70 }), 0);
  assert.ok(resolveGooOpacity({ ...splatted, tick: 48 + GOO_TICKS - 5 }) < 1);
  assert.equal(resolveGooOpacity({ ...splatted, tick: 48 + GOO_TICKS }), 0);
});
