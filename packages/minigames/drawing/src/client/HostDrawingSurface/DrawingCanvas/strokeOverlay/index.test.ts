import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingStroke } from "@wingnight/shared";

import {
  mergeStrokesForRender,
  shouldDropLocalStroke,
  type LocalStrokeRecord
} from "./index.js";

const stroke = (pointCount: number, strokeId = "stroke-1"): DrawingStroke => ({
  strokeId,
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
  endedAtMs: number | null,
  strokeId = "stroke-1"
): LocalStrokeRecord => ({ stroke: stroke(pointCount, strokeId), endedAtMs });

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

test("does paint the artist's copy of a stroke the server is behind on", () => {
  const merged = mergeStrokesForRender({
    serverStrokes: [stroke(12)],
    localStrokes: new Map([["stroke-1", localRecord(40, null)]])
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.points.length, 40);
});

test("does keep the server's copy once it has caught up", () => {
  const merged = mergeStrokesForRender({
    serverStrokes: [stroke(40)],
    localStrokes: new Map([["stroke-1", localRecord(40, 9_000_000)]])
  });

  assert.equal(merged[0]?.points.length, 40);
});

test("does paint a stroke the snapshot has not carried back yet, after the ones it has", () => {
  const merged = mergeStrokesForRender({
    serverStrokes: [stroke(9, "stroke-a")],
    localStrokes: new Map([["stroke-b", localRecord(3, null, "stroke-b")]])
  });

  assert.deepEqual(
    merged.map((entry) => entry.strokeId),
    ["stroke-a", "stroke-b"]
  );
});
