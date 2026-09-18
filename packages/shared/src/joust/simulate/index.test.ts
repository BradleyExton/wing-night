import assert from "node:assert/strict";
import test from "node:test";

import type { JoustShotRun } from "../types.js";
import {
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_TOPPLE_TILT,
  JOUST_WORLD,
  joustPinFootIndex,
  joustPinHeadIndex,
  readJoustFramePosition,
  resolveJoustPinTilt,
  resolveJoustRackSlots
} from "../world/index.js";
import { simulateJoustShot } from "./index.js";

const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];
const RACK = resolveJoustRackSlots(PERCHES, 10);
const OPEN_ARENA = { pinFeet: RACK, perches: PERCHES, obstacles: [] };
const CACTUS_ARENA = {
  pinFeet: RACK,
  perches: PERCHES,
  // A wall standing in front of the whole rack, so nothing behind it is reachable.
  obstacles: [{ x: 48, y: 36, width: 5, height: 42 }]
};

/** Up on the shelf rather than down on the sand. */
const isRaised = (pinIndex: number): boolean =>
  (RACK[pinIndex]?.y ?? JOUST_WORLD.floorY) < JOUST_WORLD.floorY - 10;
const OPTIONS = { seed: 7, maxDurationSeconds: 4.5, stepHz: 240, keyframeHz: 24 };

const bodyCount = (pinCount: number): number => JOUST_SHOOTER_BODY_COUNT + pinCount * 2;

const lastFrame = (run: JoustShotRun): readonly number[] => {
  const frame = run.keyframes[run.keyframes.length - 1];
  assert.ok(frame !== undefined);
  return frame;
};

test("produces a byte-identical track for the same lane, aim and seed", () => {
  const first = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);
  const second = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("samples every body into every frame", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.5 }, OPTIONS);

  assert.equal(run.keyframeHz, OPTIONS.keyframeHz);
  assert.ok(run.keyframes.length > 1);
  for (const frame of run.keyframes) {
    assert.equal(frame.length, bodyCount(RACK.length) * 2);
  }
});

test("still runs when the rack has already been cleared", () => {
  const run = simulateJoustShot(
    { pinFeet: [], perches: PERCHES, obstacles: [] },
    { x: -1, y: 0 },
    OPTIONS
  );

  assert.deepEqual(run.topples, []);
  for (const frame of run.keyframes) {
    assert.equal(frame.length, bodyCount(0) * 2);
  }
});

test("leaves the rack standing when nobody is shot at", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.02, y: 0 }, OPTIONS);

  assert.deepEqual(run.topples, []);
  for (let pinIndex = 0; pinIndex < RACK.length; pinIndex += 1) {
    const foot = readJoustFramePosition(lastFrame(run), joustPinFootIndex(pinIndex));
    const head = readJoustFramePosition(lastFrame(run), joustPinHeadIndex(pinIndex));

    assert.ok(resolveJoustPinTilt(foot, head) <= JOUST_TOPPLE_TILT, `pin ${pinIndex} fell over`);
  }
});

test("takes more than one player down in a single shot", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0 }, OPTIONS);
  const toppled = run.topples.map((topple) => topple.pinIndex);

  assert.ok(toppled.length > 1, `expected a pile-up, got ${toppled.join(",")}`);
});

// The whole point of standing players up on scaffolding: a flat shot cannot reach the shelf, and
// nothing but an arc gets up there. Lose this and every lane is a flat rack again.
test("keeps a flat shot down on the sand, however hard it is pulled", () => {
  for (const pull of [-1, -0.85, -0.7]) {
    const run = simulateJoustShot(OPEN_ARENA, { x: pull, y: 0 }, OPTIONS);

    for (const topple of run.topples) {
      assert.ok(
        !isRaised(topple.pinIndex),
        `a flat shot at ${pull} reached the shelf (pin ${topple.pinIndex})`
      );
    }
  }
});

test("drops a lob on the players up on the shelf", () => {
  const lob = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.7 }, OPTIONS);
  const toppled = lob.topples.map((topple) => topple.pinIndex);

  assert.ok(toppled.length > 0, "a lob should reach something");
  assert.ok(
    toppled.some(isRaised),
    `a lob should reach the shelf, hit ${toppled.join(",")}`
  );
});

test("stands the rack up on its own without a shot to hold it there", () => {
  const twitch = simulateJoustShot(OPEN_ARENA, { x: -0.02, y: 0 }, OPTIONS);

  assert.deepEqual(twitch.topples, [], "a rack that falls over by itself is not a rack");
});

test("names every toppled pin once, on a frame the replay actually has", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, OPTIONS);
  const pinIndices = run.topples.map((topple) => topple.pinIndex);

  assert.equal(new Set(pinIndices).size, pinIndices.length);
  for (const topple of run.topples) {
    assert.ok(topple.pinIndex >= 0 && topple.pinIndex < RACK.length);
    assert.ok(topple.frameIndex >= 0 && topple.frameIndex < run.keyframes.length);
  }
});

test("reports a miss when the band is barely drawn", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.05, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);
  const frontPin = RACK[0]?.x ?? 0;

  assert.deepEqual(run.topples, []);
  assert.ok(head.x < frontPin - 10, "a slack shot should drop near the slingshot");
});

test("stops the shooter at the cactus instead of passing through it", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -1, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);

  assert.deepEqual(run.topples, []);
  assert.ok(head.x < 48, `head should stay left of the cactus face, was ${head.x}`);
});

test("never lets a body fall through the floor", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -0.6, y: 0.7 }, OPTIONS);

  for (const frame of run.keyframes) {
    for (let index = 0; index < bodyCount(RACK.length); index += 1) {
      assert.ok(readJoustFramePosition(frame, index).y <= JOUST_WORLD.floorY + 0.01);
    }
  }
});

test("cuts the track once the scene has settled, before the duration cap", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.05, y: 0 }, OPTIONS);

  assert.ok(run.keyframes.length < OPTIONS.maxDurationSeconds * OPTIONS.keyframeHz);
  assert.ok(run.keyframes.length >= OPTIONS.keyframeHz, "but never shorter than a second");
});

test("respects the duration cap when nothing ever settles", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -1, y: 0.7 }, {
    ...OPTIONS,
    maxDurationSeconds: 0.5
  });

  assert.ok(run.keyframes.length <= 0.5 * OPTIONS.keyframeHz + 1);
});

test("rejects options the replay could not honour", () => {
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, keyframeHz: 7 }),
    RangeError
  );
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, seed: Number.NaN }),
    RangeError
  );
  assert.throws(
    () => simulateJoustShot(OPEN_ARENA, { x: -1, y: 0 }, { ...OPTIONS, maxDurationSeconds: 0 }),
    RangeError
  );
});
