import assert from "node:assert/strict";
import test from "node:test";

import type { DrawingStroke } from "@wingnight/shared";

import {
  isStrokeSettledOnServer,
  mergeLocalAndServerStrokes,
  ownsActiveStroke,
  shouldDropLocalStroke,
  type ActiveStrokeCapture,
  type LocalStrokeRecord
} from "./index.js";

const activeStroke = (pointerId: number): ActiveStrokeCapture => ({
  pointerId,
  strokeId: "stroke-1",
  pendingPoints: []
});

const stroke = (pointCount: number, strokeId = "stroke-1"): DrawingStroke => ({
  strokeId,
  points: Array.from({ length: pointCount }, (_unused, index) => ({
    x: index / pointCount,
    y: 0.5
  })),
  color: "#F3EEE2",
  size: 0.03
});

const localRecord = (
  pointCount: number,
  endedAtMs: number | null,
  strokeId = "stroke-1"
): LocalStrokeRecord => ({ stroke: stroke(pointCount, strokeId), endedAtMs });

const localStrokes = (
  ...records: LocalStrokeRecord[]
): Map<string, LocalStrokeRecord> => {
  return new Map(records.map((record) => [record.stroke.strokeId, record]));
};

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

test("does call a stroke settled when the server no longer holds it active", () => {
  assert.equal(
    isStrokeSettledOnServer({
      serverStroke: stroke(40),
      serverActiveStrokeId: null
    }),
    true
  );
  assert.equal(
    isStrokeSettledOnServer({
      serverStroke: stroke(40),
      serverActiveStrokeId: "stroke-2"
    }),
    true
  );
});

test("does call a stroke unsettled when the server is still extending it", () => {
  assert.equal(
    isStrokeSettledOnServer({
      serverStroke: stroke(40),
      serverActiveStrokeId: "stroke-1"
    }),
    false
  );
});

test("does call a stroke unsettled when the snapshot has not taken it yet", () => {
  assert.equal(
    isStrokeSettledOnServer({
      serverStroke: undefined,
      serverActiveStrokeId: null
    }),
    false
  );
});

test("does keep a stroke still under the artist's finger", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, null),
      serverStroke: stroke(12),
      serverActiveStrokeId: "stroke-1",
      nowMs: 9_000_000
    }),
    false
  );
});

test("does drop a stroke once the server settles it", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: stroke(40),
      serverActiveStrokeId: null,
      nowMs: 9_000_100
    }),
    true
  );
});

test("does drop a stroke the server settled shorter than the prediction", () => {
  // REGRESSION: endStroke bakes the settled stroke down with RDP, so the
  // canonical copy is permanently shorter than the tablet's raw capture. A
  // point-count hand-over reads that as "not caught up" forever and the
  // overlay only falls away on the retention timeout — four seconds of the
  // easel and the TV drawing different ink.
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(620, 9_000_000),
      serverStroke: stroke(180),
      serverActiveStrokeId: null,
      nowMs: 9_000_100
    }),
    true
  );
});

test("does hold a stroke the server has not acknowledged the end of", () => {
  // REGRESSION the other way: the tablet lifted and dispatched endStroke, but
  // the snapshot in hand still calls the stroke active. Point count would say
  // "caught up" and hand over early, dropping the tail the artist just drew.
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: stroke(40),
      serverActiveStrokeId: "stroke-1",
      nowMs: 9_000_100
    }),
    false
  );
});

test("does hold a stroke the server has not caught up on yet", () => {
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: stroke(28),
      serverActiveStrokeId: "stroke-1",
      nowMs: 9_000_100
    }),
    false
  );
});

test("does drop a stroke the server never took when the window passes", () => {
  // The stroke cap rejected it, or the socket was down: it will never settle,
  // so the retention window is the only exit. Without it the tablet would
  // keep ink the TV never received.
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(40, 9_000_000),
      serverStroke: undefined,
      serverActiveStrokeId: null,
      nowMs: 9_005_000
    }),
    true
  );
});

test("does drop a stroke stranded active by a disconnect when the window passes", () => {
  // The tablet dropped off mid-stroke, so endStroke never landed and the
  // server still calls the stroke active. Nothing will ever settle it.
  assert.equal(
    shouldDropLocalStroke({
      localRecord: localRecord(200, 9_000_000),
      serverStroke: stroke(120),
      serverActiveStrokeId: "stroke-1",
      nowMs: 9_005_000
    }),
    true
  );
});

test("does draw the local prediction while the server is still extending it", () => {
  const serverStrokes = [stroke(12)];
  const merged = mergeLocalAndServerStrokes({
    serverStrokes,
    localStrokes: localStrokes(localRecord(40, null)),
    serverActiveStrokeId: "stroke-1"
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.points.length, 40);
});

test("does draw the server's baked copy once the stroke has settled", () => {
  // REGRESSION: the baked copy holds fewer points than the overlay, so a
  // longest-wins merge would keep showing the artist the unbaked prediction
  // while the TV drew the baked one, then pop when retention expired.
  const serverStrokes = [stroke(180)];
  const merged = mergeLocalAndServerStrokes({
    serverStrokes,
    localStrokes: localStrokes(localRecord(620, 9_000_000)),
    serverActiveStrokeId: null
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0], serverStrokes[0]);
});

test("does draw an unacknowledged stroke from the overlay alone", () => {
  const merged = mergeLocalAndServerStrokes({
    serverStrokes: [],
    localStrokes: localStrokes(localRecord(9, null, "stroke-fresh")),
    serverActiveStrokeId: null
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.strokeId, "stroke-fresh");
});

test("does draw the stroke in flight over the settled ones when merging", () => {
  const settled = stroke(30, "stroke-1");
  const merged = mergeLocalAndServerStrokes({
    serverStrokes: [settled],
    localStrokes: localStrokes(
      localRecord(90, 9_000_000, "stroke-1"),
      localRecord(6, null, "stroke-2")
    ),
    serverActiveStrokeId: null
  });

  assert.deepEqual(
    merged.map((entry) => entry.strokeId),
    ["stroke-1", "stroke-2"]
  );
  assert.equal(merged[0], settled);
});

test("does drop every stroke the canvas cleared out from under the overlay", () => {
  // clearCanvas / undo / a verdict all run through finalizeStrokes, which
  // empties the overlay outright; the merge must then draw the server's
  // canvas exactly, with no orphan ink left over.
  const merged = mergeLocalAndServerStrokes({
    serverStrokes: [],
    localStrokes: localStrokes(),
    serverActiveStrokeId: null
  });

  assert.deepEqual(merged, []);
});
