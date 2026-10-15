import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingPoint } from "@wingnight/shared";

import { sanitizeDrawingPoint } from "./index.js";

const point = (x: number, y: number): DrawingPoint => ({ x, y });

test("sanitizeDrawingPoint rounds to three decimals when the sample carries full float precision", () => {
  const sanitized = sanitizeDrawingPoint(point(0.4738291847362819, 0.1234567890123));

  assert.equal(sanitized.x, 0.474);
  assert.equal(sanitized.y, 0.123);
});

test("sanitizeDrawingPoint leaves a coordinate alone when it already sits on three decimals", () => {
  const sanitized = sanitizeDrawingPoint(point(0.474, 0.125));

  assert.equal(sanitized.x, 0.474);
  assert.equal(sanitized.y, 0.125);
});

test("sanitizeDrawingPoint still clamps to the unit interval when a coordinate is out of range", () => {
  const overshoot = sanitizeDrawingPoint(point(2, -1));
  const barelyOut = sanitizeDrawingPoint(point(1.0004, -0.5006));

  assert.equal(overshoot.x, 1);
  assert.equal(overshoot.y, 0);
  assert.equal(barelyOut.x, 1);
  assert.equal(barelyOut.y, 0);
});

test("sanitizeDrawingPoint keeps a rounded coordinate inside the unit interval when the sample sits just under 1", () => {
  const sanitized = sanitizeDrawingPoint(point(0.99999, 0.0005));

  assert.equal(sanitized.x, 1);
  assert.ok(sanitized.x <= 1 && sanitized.x >= 0);
  assert.ok(sanitized.y <= 1 && sanitized.y >= 0);
});

test("sanitizeDrawingPoint yields positive zero when a coordinate rounds down from a negative sample", () => {
  const sanitized = sanitizeDrawingPoint(point(-0.0001, -0));

  assert.ok(Object.is(sanitized.x, 0), "x should be +0, not -0");
  assert.ok(Object.is(sanitized.y, 0), "y should be +0, not -0");
});

test("sanitizeDrawingPoint drops anything but x and y when an old tablet still sends a timestamp", () => {
  const stray = { x: 0.1239999, y: 0.5, t: 1234.5678 } as DrawingPoint;

  assert.deepEqual(sanitizeDrawingPoint(stray), { x: 0.124, y: 0.5 });
});
