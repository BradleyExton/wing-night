import assert from "node:assert/strict";
import test from "node:test";

import type { ContraptionLevel } from "@wingnight/shared";

import { classifyOutcome, decodeTrack, encodeTrack, gradeAttempt } from "./index.js";

const level: ContraptionLevel = {
  id: "over-the-shoulder",
  title: "Over the Shoulder",
  wing: { x: 8, y: 14, velocity: { x: 34, y: -26 } },
  bucket: { x: 68, width: 16, height: 14 },
  pickups: [
    { id: "mid-air", x: 50, y: 65, points: 2 },
    { id: "high-and-wide", x: 40, y: 30, points: 3 }
  ],
  pieceBudget: 2,
  pointsLanded: 5,
  solution: [
    { kind: "slope-right", column: 3, row: 6 },
    { kind: "slope-right", column: 5, row: 7 }
  ]
};

test("lands the known-good build, contacting every piece and collecting the pickup on the route", () => {
  const graded = gradeAttempt(level, level.solution, 1);

  assert.equal(graded.outcome, "landed");
  assert.deepEqual(graded.contactedPieceIds, ["piece-3-6", "piece-5-7"]);
  assert.deepEqual(graded.collectedPickupIds, ["mid-air"]);
  assert.equal(graded.points, 7);
  assert.ok(graded.settleSeconds !== null && graded.settleSeconds <= 4);
});

test("scores nothing when the wing is thrown with no pieces and falls short", () => {
  const graded = gradeAttempt(level, [], 1);

  assert.equal(graded.outcome, "short");
  assert.equal(graded.points, 0);
  assert.deepEqual(graded.collectedPickupIds, []);
});

// The whole architecture rests on this: the server grades once and every
// display replays the same bytes, so two gradings of one build must agree
// down to the last digit.
test("grades a build byte-identically when run twice", () => {
  const first = gradeAttempt(level, level.solution, 1);
  const second = gradeAttempt(level, level.solution, 1);

  assert.equal(JSON.stringify(second), JSON.stringify(first));
});

test("emits a 30Hz track that starts at the wing origin and ends where the wing settled", () => {
  const graded = gradeAttempt(level, level.solution, 1);
  const positions = decodeTrack(graded.track);

  assert.equal(graded.track.keyframeHz, 30);
  // 5s at 30Hz plus the starting frame.
  assert.equal(positions.length, 5 * 30 + 1);
  assert.ok(Math.abs((positions[0]?.x ?? 0) - 8) < 0.01);
  const last = positions[positions.length - 1];
  assert.ok(last !== undefined && last.x > 68 && last.x < 84, "settled inside the bucket mouth");
});

test("rounds track coordinates to two decimals on the way out", () => {
  const track = encodeTrack([{ x: 1.23456, y: 9.87654 }], 30);

  assert.deepEqual(track.positions, [1.23, 9.88]);
  assert.deepEqual(decodeTrack(track), [{ x: 1.23, y: 9.88 }]);
});

const bucket = { minX: 68, maxX: 84, topY: 84, floorY: 98 };

test("classifies a settled wing by where it came to rest", () => {
  assert.equal(classifyOutcome(bucket, { x: 76, y: 95 }, true), "landed");
  assert.equal(classifyOutcome(bucket, { x: 40, y: 95 }, true), "short");
  assert.equal(classifyOutcome(bucket, { x: 92, y: 95 }, true), "long");
  assert.equal(classifyOutcome(bucket, { x: 40, y: 50 }, true), "perched");
});

test("reports restless rather than guessing when the wing never settled", () => {
  assert.equal(classifyOutcome(bucket, { x: 76, y: 95 }, false), "restless");
});
