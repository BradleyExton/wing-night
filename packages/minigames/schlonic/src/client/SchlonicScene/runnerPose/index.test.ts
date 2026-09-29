import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart } from "@wingnight/shared";

import {
  AIR_TUCK,
  resolveBailShare,
  resolveFlipProgress,
  resolveRunnerCurl,
  resolveRunnerPose,
  resolveRunnerSlope
} from "./index.js";

const onBoard = { x: 100, vy: 0, grounded: true, grinding: false, slope: 0, curl: 0 };
const { jumpVelocity, springVelocity, maxFallVelocity, invulnerableTicks } = SCHLONIC_WORLD;

test("does stand the rider level on level ground with the board wheels down", () => {
  const pose = resolveRunnerPose({ ...onBoard, x: 104 });

  assert.equal(pose.angle, 0);
  assert.equal(pose.tuck, 0);
  assert.equal(pose.flip, 0);
});

test("does lean the rider into the hill it is rolling down", () => {
  const downhill = resolveRunnerPose({ ...onBoard, slope: 0.6 }).angle;
  const uphill = resolveRunnerPose({ ...onBoard, slope: -0.6 }).angle;

  assert.ok(downhill > 5, `a downhill barely leaned it: ${downhill}`);
  assert.equal(Math.round(uphill), -Math.round(downhill));
});

test("does flip the board once over an ollie: level off the ground, upside down at the top, level to land", () => {
  const air = { ...onBoard, grounded: false, curl: 1 };

  assert.equal(resolveRunnerPose({ ...air, vy: jumpVelocity }).flip, 0);
  assert.equal(resolveRunnerPose({ ...air, vy: 0 }).flip, 180);
  assert.equal(resolveRunnerPose({ ...air, vy: -jumpVelocity }).flip, 360);
  // Past a tap's landing speed the flip is done and the board stays level for the drop.
  assert.equal(resolveRunnerPose({ ...air, vy: maxFallVelocity }).flip, 360);
});

test("does hold the board level off a springboard until the climb slows to a jump's", () => {
  assert.equal(resolveFlipProgress(springVelocity), 0);
  assert.ok(resolveFlipProgress(jumpVelocity / 2) > 0.2);
});

test("does put the board back wheels down the moment the feet are down, whatever the speed", () => {
  assert.equal(resolveRunnerPose({ ...onBoard, vy: 0.4 }).flip, 0);
});

test("does take the flip off the frame alone, so two screens agree without talking", () => {
  const input = { x: 412.5, vy: -0.6, grounded: false, grinding: false, slope: 0.2, curl: 1 };

  assert.deepEqual(resolveRunnerPose(input), resolveRunnerPose(input));
});

test("does tuck the hen only a little over the board in the air, and pitch it with the arc", () => {
  const rising = resolveRunnerPose({ ...onBoard, grounded: false, curl: 1, vy: jumpVelocity });
  const falling = resolveRunnerPose({ ...onBoard, grounded: false, curl: 1, vy: -jumpVelocity });

  assert.equal(rising.tuck, AIR_TUCK);
  assert.ok(rising.angle < 0, "a rising board should be nose up");
  assert.ok(falling.angle > 0, "a falling board should be nose down");
});

test("does knock the wheels over the slab joints on the sidewalk and never in the air or on a rail", () => {
  const knocks = [0, 2, 4, 6, 8.2].map((step) => resolveRunnerPose({ ...onBoard, x: 96 + step }).bob);

  assert.ok(Math.max(...knocks) > 0.2, "a board rolling over slabs should knock");
  assert.ok(knocks.every((bob) => bob >= 0));
  assert.equal(resolveRunnerPose({ ...onBoard, x: 96, grounded: false, curl: 1 }).bob, 0);
  assert.equal(resolveRunnerPose({ ...onBoard, x: 96, grinding: true }).bob, 0);
});

test("does curl towards the tuck off the ground and back out on landing", () => {
  assert.ok(resolveRunnerCurl(false, 0) > 0.3);
  assert.ok(resolveRunnerCurl(false, 0.9) > 0.9);
  assert.ok(resolveRunnerCurl(true, 1) < 0.6);
  assert.ok(resolveRunnerCurl(true, 0.1) < 0.1);
});

test("does lean with the rail, not the hill under it, while the bird is grinding", () => {
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
  assert.equal(resolveRunnerPose({ ...onBoard, grinding: true, slope: 0 }).angle, 0);
});

test("does bail for the mercy window after a hit and not a tick longer", () => {
  assert.equal(resolveBailShare({ hits: [], tick: 50 }), null);
  assert.equal(resolveBailShare({ hits: [40], tick: 40 }), 0);
  assert.ok((resolveBailShare({ hits: [40], tick: 75 }) ?? 0) > 0.4);
  assert.equal(resolveBailShare({ hits: [40], tick: 40 + invulnerableTicks }), null);
});
