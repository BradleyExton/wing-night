import assert from "node:assert/strict";
import test from "node:test";

import {
  createStrokeId,
  ownsActiveStroke,
  toNormalizedPoint,
  type ActiveStrokeCapture
} from "./index.js";

const activeStroke = (pointerId: number): ActiveStrokeCapture => ({
  pointerId,
  strokeId: "stroke-1",
  startedAtMs: 0,
  pendingPoints: []
});

const BOARD = { left: 100, top: 40, width: 200, height: 100 };

test("does accept samples from the finger that started the stroke", () => {
  assert.equal(ownsActiveStroke(activeStroke(1), 1), true);
});

test("does ignore a second finger while a stroke is in flight", () => {
  // A resting palm reports its own pointerId; steering the live stroke with
  // it drags a streak across the drawing.
  assert.equal(ownsActiveStroke(activeStroke(1), 2), false);
});

test("does ignore a lift from a finger that owns no stroke", () => {
  assert.equal(ownsActiveStroke(activeStroke(1), 2), false);
  assert.equal(ownsActiveStroke(null, 1), false);
});

test("does normalize a point against the board it was drawn on", () => {
  assert.deepEqual(
    toNormalizedPoint({
      clientX: 150,
      clientY: 65,
      bounds: BOARD,
      startedAtMs: 1_000,
      nowMs: 1_250
    }),
    { x: 0.25, y: 0.25, t: 250 }
  );
});

test("does clamp a finger that slid off the board back onto it", () => {
  const point = toNormalizedPoint({
    clientX: 20,
    clientY: 9_000,
    bounds: BOARD,
    startedAtMs: 1_000,
    nowMs: 900
  });

  assert.deepEqual(point, { x: 0, y: 1, t: 0 }, "and time never runs backwards");
});

test("does hand every stroke its own id", () => {
  assert.notEqual(createStrokeId(), createStrokeId());
});
