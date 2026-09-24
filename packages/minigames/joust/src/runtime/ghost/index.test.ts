import assert from "node:assert/strict";
import test from "node:test";

import type { JoustMinigameShot } from "@wingnight/shared";
import { JOUST_SHOOTER_HEAD_INDEX } from "@wingnight/shared";

import { resolveShotGhost } from "./index.js";

const FLOOR_Y = 78;

const shotWithHeadAt = (heads: Array<[number, number]>): JoustMinigameShot => ({
  shotNumber: 2,
  toppledPlayerIds: [],
  collapsedPerchIndices: [],
  isRackCleared: false,
  points: 0,
  aim: { x: -0.8, y: 0.3 },
  shooterId: "standard",
  pinPlayerIds: [],
  rubblePerchIndices: [],
  run: {
    keyframeHz: 24,
    keyframes: heads.map(([x, y]) => {
      const frame = Array.from({ length: (JOUST_SHOOTER_HEAD_INDEX + 3) * 2 }, () => 0);

      frame[JOUST_SHOOTER_HEAD_INDEX * 2] = x;
      frame[JOUST_SHOOTER_HEAD_INDEX * 2 + 1] = y;
      return frame;
    }),
    topples: [],
    collapses: []
  }
});

test("does keep the arc up to the frame the head first turns back", () => {
  const ghost = resolveShotGhost(
    shotWithHeadAt([
      [40, 46],
      [50, 40],
      [60, 38],
      [70, 42],
      [66, 50],
      [60, 60]
    ]),
    FLOOR_Y
  );

  assert.equal(ghost.shotNumber, 2);
  assert.deepEqual(ghost.aim, { x: -0.8, y: 0.3 });
  assert.deepEqual(
    ghost.path.map((at) => at.x),
    [40, 50, 60, 70]
  );
});

test("does end the arc where the head comes level with the floor", () => {
  const ghost = resolveShotGhost(
    shotWithHeadAt([
      [40, 46],
      [55, 60],
      [70, 78],
      [85, 78]
    ]),
    FLOOR_Y
  );

  assert.deepEqual(
    ghost.path.map((at) => at.x),
    [40, 55]
  );
});

test("does carry a whole flight that never hits anything", () => {
  const ghost = resolveShotGhost(
    shotWithHeadAt([
      [40, 46],
      [80, 30],
      [120, 40],
      [170, 70]
    ]),
    FLOOR_Y
  );

  assert.equal(ghost.path.length, 4);
});
