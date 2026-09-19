import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingPoint } from "@wingnight/shared";

import { STROKE_SIMPLIFY_EPSILON, simplifyStroke } from "./index.js";

const point = (x: number, y: number): DrawingPoint => ({ x, y });

// Straight-line distance from a point to the segment through a and b, written
// out independently of the implementation so the assertions below measure the
// baked stroke rather than re-using the code under test.
const distanceToSegment = (
  subject: DrawingPoint,
  a: DrawingPoint,
  b: DrawingPoint
): number => {
  const segmentX = b.x - a.x;
  const segmentY = b.y - a.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (lengthSquared === 0) {
    return Math.hypot(subject.x - a.x, subject.y - a.y);
  }

  const projection =
    ((subject.x - a.x) * segmentX + (subject.y - a.y) * segmentY) /
    lengthSquared;
  const clamped = Math.min(1, Math.max(0, projection));

  return Math.hypot(
    subject.x - (a.x + clamped * segmentX),
    subject.y - (a.y + clamped * segmentY)
  );
};

const maxDeviationFromBaked = (
  original: DrawingPoint[],
  baked: DrawingPoint[]
): number => {
  let worst = 0;

  for (const subject of original) {
    let nearest = Number.POSITIVE_INFINITY;

    for (let index = 0; index < baked.length - 1; index += 1) {
      nearest = Math.min(
        nearest,
        distanceToSegment(
          subject,
          baked[index] as DrawingPoint,
          baked[index + 1] as DrawingPoint
        )
      );
    }

    worst = Math.max(worst, nearest);
  }

  return worst;
};

test("does return nothing when the stroke has no points", () => {
  assert.deepEqual(simplifyStroke([]), []);
});

test("does keep the dot when the stroke is a single-point tap", () => {
  // A tap is a legitimate mark on the easel — perfect-freehand renders one
  // point as a blob. Dropping it would silently erase ink the artist made.
  assert.deepEqual(simplifyStroke([point(0.4, 0.6)]), [point(0.4, 0.6)]);
});

test("does keep both ends when the stroke has only two points", () => {
  assert.deepEqual(simplifyStroke([point(0, 0), point(1, 1)]), [
    point(0, 0),
    point(1, 1)
  ]);
});

test("does collapse to the endpoints when every point is collinear", () => {
  const points = Array.from({ length: 40 }, (_unused, index) =>
    point(index / 39, index / 39)
  );

  assert.deepEqual(simplifyStroke(points), [point(0, 0), point(1, 1)]);
});

test("does collapse to the endpoints when no point strays past the tolerance", () => {
  const wobble = Array.from({ length: 51 }, (_unused, index) =>
    point(0.2 + index * 0.01, 0.5 + (index % 2 === 0 ? 0.0004 : -0.0004))
  );

  const baked = simplifyStroke(wobble);

  assert.deepEqual(baked, [wobble[0], wobble[wobble.length - 1]]);
});

test("does preserve the endpoints when the stroke is baked down hard", () => {
  const points = Array.from({ length: 200 }, (_unused, index) =>
    point(0.05 + index * 0.004, 0.5 + Math.sin(index / 7) * 0.0003)
  );

  const baked = simplifyStroke(points);

  assert.equal(baked.length < points.length, true);
  assert.deepEqual(baked[0], points[0]);
  assert.deepEqual(baked[baked.length - 1], points[points.length - 1]);
});

test("does keep the corner when a point strays past the tolerance", () => {
  const baked = simplifyStroke([
    point(0, 0),
    point(0.25, 0.25),
    point(0.5, 0.5),
    point(0.5, 0.9),
    point(0.5, 1)
  ]);

  assert.deepEqual(baked, [point(0, 0), point(0.5, 0.5), point(0.5, 1)]);
});

test("does keep the far point when the stroke returns to where it started", () => {
  // Start and end coincide, so the first chord has no perpendicular; the
  // degenerate case has to fall back to plain distance or the whole loop
  // collapses to a dot.
  const baked = simplifyStroke([
    point(0.5, 0.5),
    point(0.5, 0.2),
    point(0.8, 0.2),
    point(0.5, 0.5)
  ]);

  assert.equal(baked.length, 4);
});

test("does stay within the tolerance when a dense scribble is baked", () => {
  // Coordinates sit on the same 0.001 grid the wire rounds them to, and x
  // advances one grid step per sample, so this is shaped like the real
  // capture the 74% reduction was measured on.
  const scribble = Array.from({ length: 900 }, (_unused, index) => {
    const x = (50 + index) / 1000;
    return point(x, Math.round((0.5 + Math.sin(index / 150) * 0.3) * 1000) / 1000);
  });

  const baked = simplifyStroke(scribble);

  assert.equal(baked.length < scribble.length / 2, true);
  assert.equal(
    maxDeviationFromBaked(scribble, baked) <= STROKE_SIMPLIFY_EPSILON + 1e-9,
    true
  );
});

test("does keep the surviving points in their original order when baking", () => {
  const points = Array.from({ length: 120 }, (_unused, index) =>
    point(index / 119, Math.round(Math.sin(index / 5) * 400) / 1000 + 0.5)
  );

  const baked = simplifyStroke(points);
  let cursor = 0;

  for (const bakedPoint of baked) {
    while (cursor < points.length && points[cursor] !== bakedPoint) {
      cursor += 1;
    }

    assert.equal(cursor < points.length, true);
    cursor += 1;
  }
});

test("does leave the original array untouched when baking a stroke", () => {
  const points = [point(0, 0), point(0.5, 0.5001), point(1, 1)];
  const snapshot = points.map((entry) => ({ ...entry }));

  simplifyStroke(points);

  assert.deepEqual(points, snapshot);
});

test("does honour a caller-supplied tolerance when it is widened", () => {
  const points = [point(0, 0), point(0.5, 0.2), point(1, 0)];

  assert.equal(simplifyStroke(points).length, 3);
  assert.deepEqual(simplifyStroke(points, 0.5), [point(0, 0), point(1, 0)]);
});
