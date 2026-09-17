import assert from "node:assert/strict";
import test from "node:test";

import type { JoustShotRun } from "../types.js";
import {
  JOUST_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  readJoustFramePosition
} from "../world/index.js";
import { simulateJoustShot } from "./index.js";

const OPEN_ARENA = { targetX: 126, obstacles: [] };
const CACTUS_ARENA = {
  targetX: 126,
  obstacles: [{ x: 78, y: 54, width: 6, height: 24 }]
};
const OPTIONS = { seed: 7, maxDurationSeconds: 4, stepHz: 240, keyframeHz: 30 };

const lastFrame = (run: JoustShotRun): readonly number[] => {
  const frame = run.keyframes[run.keyframes.length - 1];
  assert.ok(frame !== undefined);
  return frame;
};

test("produces a byte-identical track for the same arena, aim and seed", () => {
  const first = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);
  const second = simulateJoustShot(CACTUS_ARENA, { x: -0.8, y: 0.5 }, OPTIONS);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("samples every body into every frame", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.7, y: 0.5 }, OPTIONS);

  assert.equal(run.keyframeHz, OPTIONS.keyframeHz);
  assert.ok(run.keyframes.length > 1);
  for (const frame of run.keyframes) {
    assert.equal(frame.length, JOUST_BODY_COUNT * 2);
  }
});

test("lands a well-aimed lob on the champ", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -0.85, y: 0.55 }, OPTIONS);

  assert.notEqual(run.hitZone, null);
  assert.notEqual(run.hitFrameIndex, null);
  assert.ok((run.hitFrameIndex ?? 0) < run.keyframes.length);
});

test("reports a miss when the band is barely drawn", () => {
  const run = simulateJoustShot(OPEN_ARENA, { x: -0.05, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);

  assert.equal(run.hitZone, null);
  assert.equal(run.hitFrameIndex, null);
  assert.ok(head.x < OPEN_ARENA.targetX - 40, "a slack shot should drop near the slingshot");
});

test("stops the shooter at the cactus instead of passing through it", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -1, y: 0 }, OPTIONS);
  const head = readJoustFramePosition(lastFrame(run), JOUST_SHOOTER_HEAD_INDEX);

  assert.equal(run.hitZone, null);
  assert.ok(head.x < 78, `head should stay left of the cactus face, was ${head.x}`);
});

test("never lets a body fall through the floor", () => {
  const run = simulateJoustShot(CACTUS_ARENA, { x: -0.6, y: 0.7 }, OPTIONS);

  for (const frame of run.keyframes) {
    for (let index = 0; index < JOUST_BODY_COUNT; index += 1) {
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
