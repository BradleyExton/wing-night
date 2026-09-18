import assert from "node:assert/strict";
import test from "node:test";

import type { ContraptionLevel } from "@wingnight/shared";

import { buildLayout, FLOOR_Y, toBucketSegments, toPieceSegment } from "./index.js";

const level: ContraptionLevel = {
  id: "l1",
  title: "Level",
  wing: { x: 8, y: 14, velocity: { x: 34, y: -26 } },
  bucket: { x: 68, width: 16, height: 14 },
  obstacles: [{ id: "ledge", from: { x: 26, y: 48 }, to: { x: 56, y: 48 } }],
  pieceBudget: 2,
  pointsLanded: 5,
  solution: []
};

test("maps a shelf to a flat segment across the middle of its cell", () => {
  const segment = toPieceSegment({ kind: "shelf", column: 3, row: 6 });

  assert.deepEqual(segment.from, { x: 30, y: 65 });
  assert.deepEqual(segment.to, { x: 40, y: 65 });
});

test("descends to the right for right-handed slopes and to the left for left-handed ones", () => {
  const right = toPieceSegment({ kind: "slope-right", column: 0, row: 0 });
  const left = toPieceSegment({ kind: "steep-left", column: 0, row: 0 });

  // y grows downward, so "descends to the right" means to.y > from.y.
  assert.ok(right.to.y > right.from.y);
  assert.ok(left.to.y < left.from.y);
});

test("keeps a steep piece inside its own cell", () => {
  const segment = toPieceSegment({ kind: "steep-right", column: 9, row: 9 });

  assert.deepEqual(segment.from, { x: 90, y: 90 });
  assert.deepEqual(segment.to, { x: 100, y: 100 });
});

test("stands the bucket on the floor with its mouth `height` units up", () => {
  const [left, right] = toBucketSegments(level);

  assert.deepEqual(left?.from, { x: 68, y: FLOOR_Y });
  assert.deepEqual(left?.to, { x: 68, y: FLOOR_Y - 14 });
  assert.deepEqual(right?.from, { x: 84, y: FLOOR_Y });
});

test("builds one layout from frame, bucket, obstacles, pieces and a thrown wing", () => {
  const layout = buildLayout(level, [{ kind: "shelf", column: 1, row: 1 }]);
  const ids = layout.segments.map((segment) => segment.id);

  assert.deepEqual(ids, [
    "floor",
    "wall-left",
    "wall-right",
    "bucket-left",
    "bucket-right",
    "obstacle-ledge",
    "piece-1-1"
  ]);
  assert.equal(layout.bodies.length, 1);
  assert.deepEqual(layout.bodies[0]?.origin, { x: 8, y: 14 });
  assert.deepEqual(layout.bodies[0]?.initialVelocity, { x: 34, y: -26 });
});
