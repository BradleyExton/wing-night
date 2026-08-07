import assert from "node:assert/strict";
import test from "node:test";

import { attemptsDiffer, bestAttempt, buildLabAttempts, type LabAttempt } from "./index";

const BASE = {
  pieceSetId: "four",
  attempts: 3,
  variation: "seed",
  seed: 20260807,
  durationSeconds: 4,
  keyframeHz: 30
} as const;

test("builds one attempt per requested try", () => {
  assert.equal(buildLabAttempts({ ...BASE, attempts: 2 }).length, 2);
});

test("grades every attempt it builds", () => {
  for (const attempt of buildLabAttempts(BASE)) {
    assert.notEqual(attempt.outcome, null);
  }
});

test("weighs every attempt's track so the sim-length knob shows its cost", () => {
  for (const attempt of buildLabAttempts(BASE)) {
    assert.ok(attempt.bytes.jsonFlatRoundedBytes > 0);
    assert.equal(attempt.bytes.keyframeHz, BASE.keyframeHz);
  }
});

// WN-15 question 3. This is the finding, asserted rather than described: re-rolling the seed on a
// fixed build is not a second attempt, because the integrator's jitter never amplifies.
test("produces indistinguishable attempts when only the seed varies", () => {
  assert.equal(attemptsDiffer(buildLabAttempts({ ...BASE, variation: "seed" })), false);
});

test("produces distinguishable attempts when the team rebuilds between tries", () => {
  assert.equal(attemptsDiffer(buildLabAttempts({ ...BASE, variation: "rebuild" })), true);
});

test("leaves the first attempt un-nudged so it is the build as authored", () => {
  const [seeded] = buildLabAttempts({ ...BASE, variation: "seed" });
  const [rebuilt] = buildLabAttempts({ ...BASE, variation: "rebuild" });

  assert.deepEqual(rebuilt.layout.segments, seeded.layout.segments);
});

test("moves only the last placed ramp when a rebuild attempt nudges the build", () => {
  const attempts = buildLabAttempts({ ...BASE, variation: "rebuild" });
  const first = attempts[0].layout.segments;
  const third = attempts[2].layout.segments;
  const moved = first.filter((segment, index) => {
    return segment.from.x !== third[index].from.x || segment.to.x !== third[index].to.x;
  });

  assert.equal(moved.length, 1);
  assert.equal(moved[0].id, "ramp-d");
});

test("leaves the bucket where it is when a rebuild attempt nudges the build", () => {
  const attempts = buildLabAttempts({ ...BASE, variation: "rebuild" });
  const bucketOf = (attempt: LabAttempt): readonly string[] =>
    attempt.layout.segments
      .filter((segment) => segment.id.startsWith("bucket-"))
      .map((segment) => `${segment.id}:${segment.from.x}:${segment.to.x}`);

  assert.deepEqual(bucketOf(attempts[2]), bucketOf(attempts[0]));
});

const attemptWith = (index: number, landed: boolean, missX: number): LabAttempt =>
  ({
    index,
    label: `Attempt ${index + 1}`,
    outcome: { landed, missX, reason: landed ? "landed" : "short" }
  }) as unknown as LabAttempt;

test("picks the landing attempt when only one attempt landed", () => {
  const best = bestAttempt([
    attemptWith(0, false, 1),
    attemptWith(1, true, 8),
    attemptWith(2, false, 2)
  ]);

  assert.equal(best?.index, 1);
});

test("picks the nearest miss when no attempt landed", () => {
  const best = bestAttempt([
    attemptWith(0, false, -9),
    attemptWith(1, false, 3),
    attemptWith(2, false, -12)
  ]);

  assert.equal(best?.index, 1);
});

test("picks no winner when there were no attempts", () => {
  assert.equal(bestAttempt([]), null);
});

test("reports no variance when there is only a single attempt", () => {
  assert.equal(attemptsDiffer(buildLabAttempts({ ...BASE, attempts: 1 })), false);
});
