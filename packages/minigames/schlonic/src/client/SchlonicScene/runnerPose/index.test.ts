import assert from "node:assert/strict";
import test from "node:test";

import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import {
  SCHLONIC_RIDE_ONS,
  SCHLONIC_WORLD,
  createSchlonicRunStart,
  resolveSchlonicGroundY,
  resolveSchlonicZone,
  stepSchlonic
} from "@wingnight/shared";

import { resolveRunnerClearance } from "../../runnerClearance/index.js";
import {
  AIR_TUCK,
  resolveBailShare,
  resolveFlipProgress,
  resolveRunnerCurl,
  resolveRunnerPose,
  resolveRunnerSlope
} from "./index.js";

const onBoard = { x: 100, vy: 0, clearance: 0, grinding: false, slope: 0, curl: 0 };
/** Well clear of the street: in the air as far as the picture is concerned. */
const AIR = 10;
const { jumpVelocity, kickerVelocity, maxFallVelocity, invulnerableTicks } = SCHLONIC_WORLD;

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

test("does flip the board once on the way up an ollie: level off the ground, upside down half way, caught level at the top", () => {
  const air = { ...onBoard, clearance: AIR, curl: 1 };

  assert.equal(resolveRunnerPose({ ...air, vy: jumpVelocity }).flip, 0);
  assert.equal(resolveRunnerPose({ ...air, vy: jumpVelocity / 2 }).flip, 180);
  assert.equal(resolveRunnerPose({ ...air, vy: 0 }).flip, 0);
  // Coming down, at any speed, the board is caught: level for the landing.
  assert.equal(resolveRunnerPose({ ...air, vy: -jumpVelocity }).flip, 0);
  assert.equal(resolveRunnerPose({ ...air, vy: maxFallVelocity }).flip, 0);
});

test("does hold the board level off a kicker until the climb slows to a jump's", () => {
  assert.equal(resolveFlipProgress(kickerVelocity), 0);
  assert.ok(resolveFlipProgress(jumpVelocity / 2) > 0.2);
});

test("does put the board back wheels down the moment the feet are down, whatever the speed", () => {
  assert.equal(resolveRunnerPose({ ...onBoard, vy: -0.4 }).flip, 0);
});

test("does keep the board level when it is only skipping a unit or two off the paving", () => {
  assert.equal(resolveRunnerPose({ ...onBoard, clearance: 1.5, vy: jumpVelocity / 2, curl: 0.45 }).flip, 0);
});

test("does take the flip off the frame alone, so two screens agree without talking", () => {
  const input = { x: 412.5, vy: -0.6, clearance: AIR, grinding: false, slope: 0.2, curl: 1 };

  assert.deepEqual(resolveRunnerPose(input), resolveRunnerPose(input));
});

test("does tuck the hen only a little over the board in the air, and pitch it with the arc", () => {
  const rising = resolveRunnerPose({ ...onBoard, clearance: AIR, curl: 1, vy: jumpVelocity });
  const falling = resolveRunnerPose({ ...onBoard, clearance: AIR, curl: 1, vy: -jumpVelocity });

  assert.equal(rising.tuck, AIR_TUCK);
  assert.ok(rising.angle < 0, "a rising board should be nose up");
  assert.ok(falling.angle > 0, "a falling board should be nose down");
});

test("does knock the wheels over the slab joints on the sidewalk and never in the air or on a rail", () => {
  const knocks = [0, 2, 4, 6, 8.2].map((step) => resolveRunnerPose({ ...onBoard, x: 96 + step }).bob);

  assert.ok(Math.max(...knocks) > 0.2, "a board rolling over slabs should knock");
  assert.ok(knocks.every((bob) => bob >= 0));
  assert.equal(resolveRunnerPose({ ...onBoard, x: 96, clearance: AIR, curl: 1 }).bob, 0);
  assert.equal(resolveRunnerPose({ ...onBoard, x: 96, grinding: true }).bob, 0);
});

test("does curl towards the tuck in the air and back out on landing", () => {
  assert.ok(resolveRunnerCurl(true, 0) > 0.3);
  assert.ok(resolveRunnerCurl(true, 0.9) > 0.9);
  assert.ok(resolveRunnerCurl(false, 1) < 0.6);
  assert.ok(resolveRunnerCurl(false, 0.1) < 0.1);
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

// The party zone (seed 20260919, 22 chunks): the hill from x≈340 is steep enough that a board
// rolling down it skips off the paving and touches down again, and chunk 2 is a grind rail.
const PARTY = resolveSchlonicZone({ seed: 20260919, chunks: 22 });

const flipOf = (zone: SchlonicZone, frame: SchlonicFrame): number => {
  return resolveRunnerPose({
    x: frame.x,
    vy: frame.vy,
    clearance: resolveRunnerClearance(zone, frame),
    grinding: frame.grindingRail !== null,
    slope: resolveRunnerSlope(zone, frame),
    curl: 0
  }).flip;
};

/** Steps `from` with the button as `pressAt` says until `until` says stop, every frame on the way. */
const ride = (
  zone: SchlonicZone,
  from: SchlonicFrame,
  until: (frame: SchlonicFrame) => boolean,
  pressAt = -1
): SchlonicFrame[] => {
  const frames: SchlonicFrame[] = [];
  let frame = from;

  while (!until(frame) && frame.outcome === null && frames.length < 2000) {
    frame = stepSchlonic(frame, zone, { pressed: frame.tick === pressAt, holding: false });
    frames.push(frame);
  }

  return frames;
};

test("does not flip the board when it drifts down a slope off the paving", () => {
  const x = 340;
  const from = { ...createSchlonicRunStart(PARTY), x, y: resolveSchlonicGroundY(PARTY, x) - SCHLONIC_WORLD.runnerRadius, vx: SCHLONIC_WORLD.topSpeed };
  const frames = ride(PARTY, from, (frame) => frame.x > 460);

  assert.ok(frames.some((frame) => !frame.grounded), "the repro should skip off the slope at least once");
  assert.deepEqual(frames.filter((frame) => flipOf(PARTY, frame) !== 0).map((frame) => frame.x), []);
});

test("does not flip the board when it rolls off a rail's end", () => {
  // The first piece of furniture a bench's height or more, so the roll off its end is a fall.
  const rail = PARTY.props.find((prop) => {
    return prop.kind === "rail" && resolveSchlonicGroundY(PARTY, prop.x) - prop.y >= SCHLONIC_RIDE_ONS.bench.above;
  });

  assert.ok(rail?.toX !== undefined);

  const from = {
    ...createSchlonicRunStart(PARTY),
    x: rail.toX - 6,
    y: rail.y - SCHLONIC_WORLD.runnerRadius,
    vx: SCHLONIC_WORLD.topSpeed,
    grindingRail: rail.index
  };
  const frames = ride(PARTY, from, (frame) => frame.grounded && frame.grindingRail === null);

  assert.ok(frames.filter((frame) => !frame.grounded).length > 8, "the rail's end should be a real drop");
  assert.deepEqual(frames[frames.length - 1]?.hits, [], "the drop should clear the crowd past the rail's end");
  assert.deepEqual(frames.filter((frame) => flipOf(PARTY, frame) !== 0).map((frame) => frame.tick), []);
});

test("does flip the board exactly once and land it level when the rider ollies", () => {
  const from = { ...createSchlonicRunStart(PARTY), x: 60, vx: SCHLONIC_WORLD.topSpeed };
  const frames = ride(PARTY, from, (frame) => frame.tick > 1 && frame.grounded, 0);
  const flips = frames.map((frame) => flipOf(PARTY, frame));
  const wraps = flips.filter((flip, index) => index > 0 && (flips[index - 1] ?? 0) - flip > 180).length;

  assert.ok(Math.max(...flips) > 300, `the board never came round: ${Math.max(...flips)}`);
  assert.equal(wraps, 1, "one ollie, one flip");
  assert.equal(flips[flips.length - 1], 0);
  assert.equal(flips[flips.length - 2], 0, "the board should be level before the wheels touch");
});
