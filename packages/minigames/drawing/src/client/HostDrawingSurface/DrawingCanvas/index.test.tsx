import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingStroke } from "@wingnight/shared";

import {
  ownsActiveStroke,
  shouldDropLocalStroke,
  type ActiveStrokeCapture,
  type LocalStrokeRecord
} from "./index.js";

const activeStroke = (pointerId: number): ActiveStrokeCapture => ({
  pointerId,
  strokeId: "stroke-1",
  startedAtMs: 0,
  pendingPoints: []
});

const stroke = (pointCount: number): DrawingStroke => ({
  strokeId: "stroke-1",
  points: Array.from({ length: pointCount }, (_unused, index) => ({
    x: index / pointCount,
    y: 0.5,
    t: index
  })),
  color: "#F3EEE2",
  size: 0.03
});

const localRecord = (
  pointCount: number,
  endedAtMs: number | null
): LocalStrokeRecord => ({ stroke: stroke(pointCount), endedAtMs });

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

test("does keep a stroke still under the artist's finger", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, null),
      serverStroke: stroke(12),
      nowMs: 9_000_000
    }),
    false
  );
});

test("does drop a stroke once the canonical snapshot carries it whole", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: stroke(40),
      nowMs: 9_000_100
    }),
    true
  );
});

test("does hold a stroke the server has not caught up on yet", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: stroke(28),
      nowMs: 9_000_100
    }),
    false
  );
});

test("does drop a stroke the server trimmed at its point cap", () => {
  // The trimmed stroke never grows again, so the retention window is the
  // only exit — without it the tablet keeps ink the TV never received.
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(620, 9_000_000),
      serverStroke: stroke(500),
      nowMs: 9_005_000
    }),
    true
  );
});

test("does drop a stroke the server never took when the window passes", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: undefined,
      nowMs: 9_005_000
    }),
    true
  );
});
