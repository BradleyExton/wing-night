import {
  CONTRAPTION_BENCHMARK_LAYOUT,
  simulateContraption,
  type ContraptionLayout,
  type ContraptionSegment
} from "@wingnight/shared";
import assert from "node:assert/strict";
import test from "node:test";

import { resolveBucket, resolveRunOutcome } from "./index";

// Every case below drives the REAL WN-17 integrator rather than a hand-written track, so these
// assertions fail if the physics changes under the harness — which is the point of a lab that
// exists to judge what the physics feels like.

const FLOOR: ContraptionSegment = {
  id: "floor",
  from: { x: 0, y: 20 },
  to: { x: 20, y: 20 }
};

// A bucket spanning x 8..12 with its mouth at y 14, standing on the floor at y 20.
const BUCKET_LEFT: ContraptionSegment = {
  id: "bucket-left",
  from: { x: 8, y: 20 },
  to: { x: 8, y: 14 }
};

const BUCKET_RIGHT: ContraptionSegment = {
  id: "bucket-right",
  from: { x: 12, y: 20 },
  to: { x: 12, y: 14 }
};

const dropLayout = (
  wingX: number,
  extraSegments: readonly ContraptionSegment[] = []
): ContraptionLayout => {
  return {
    gravity: { x: 0, y: 60 },
    segments: [FLOOR, BUCKET_LEFT, BUCKET_RIGHT, ...extraSegments],
    bodies: [
      { id: "wing", origin: { x: wingX, y: 3 }, radius: 1, restitution: 0.1, slip: 0.5 }
    ]
  };
};

const gradeDrop = (
  wingX: number,
  {
    durationSeconds = 3,
    extraSegments = []
  }: { durationSeconds?: number; extraSegments?: readonly ContraptionSegment[] } = {}
): NonNullable<ReturnType<typeof resolveRunOutcome>> => {
  const layout = dropLayout(wingX, extraSegments);
  const run = simulateContraption(layout, {
    seed: 7,
    durationSeconds,
    stepHz: 240,
    keyframeHz: 30
  });
  const outcome = resolveRunOutcome({ layout, run });

  assert.notEqual(outcome, null, "expected a gradeable run");

  return outcome as NonNullable<typeof outcome>;
};

test("grades a run landed when the wing settles inside the bucket mouth", () => {
  const outcome = gradeDrop(10);

  assert.equal(outcome.reason, "landed");
  assert.equal(outcome.landed, true);
});

test("grades a run short when the wing settles left of the bucket", () => {
  const outcome = gradeDrop(3);

  assert.equal(outcome.reason, "short");
  assert.equal(outcome.landed, false);
});

test("grades a run long when the wing settles right of the bucket", () => {
  const outcome = gradeDrop(17);

  assert.equal(outcome.reason, "long");
  assert.equal(outcome.landed, false);
});

test("reports a negative missX when the wing settles short of the bucket centre", () => {
  const outcome = gradeDrop(3);

  assert.ok(outcome.missX < 0, `expected a negative missX, got ${outcome.missX}`);
});

test("reports a positive missX when the wing settles past the bucket centre", () => {
  const outcome = gradeDrop(17);

  assert.ok(outcome.missX > 0, `expected a positive missX, got ${outcome.missX}`);
});

test("grades a run perched when the wing settles on a ledge above the bucket floor", () => {
  const ledge: ContraptionSegment = {
    id: "ledge",
    from: { x: 0, y: 10 },
    to: { x: 5, y: 10 }
  };
  const outcome = gradeDrop(2, { extraSegments: [ledge] });

  assert.equal(outcome.reason, "perched");
});

test("grades a run restless when the wing is still moving as the window closes", () => {
  const outcome = gradeDrop(10, { durationSeconds: 0.2 });

  assert.equal(outcome.reason, "restless");
  assert.equal(outcome.landed, false);
});

test("reports no settle time when the run never settles", () => {
  const outcome = gradeDrop(10, { durationSeconds: 0.2 });

  assert.equal(outcome.settleSeconds, null);
});

test("reports a settle time inside the run window when the wing comes to rest", () => {
  const outcome = gradeDrop(10);

  assert.notEqual(outcome.settleSeconds, null);
  assert.ok(
    (outcome.settleSeconds as number) > 0 && (outcome.settleSeconds as number) <= 3,
    `expected a settle time within the 3s window, got ${String(outcome.settleSeconds)}`
  );
});

test("derives the bucket region from the bucket-prefixed segments", () => {
  const bucket = resolveBucket(dropLayout(10));

  assert.deepEqual(bucket, { minX: 8, maxX: 12, topY: 14, floorY: 20 });
});

test("derives no bucket region when the layout has no bucket segments", () => {
  const bucket = resolveBucket({
    gravity: { x: 0, y: 60 },
    segments: [FLOOR],
    bodies: []
  });

  assert.equal(bucket, null);
});

test("refuses to grade a layout that has no wing body", () => {
  const layout: ContraptionLayout = {
    gravity: { x: 0, y: 60 },
    segments: [FLOOR, BUCKET_LEFT, BUCKET_RIGHT],
    bodies: [
      { id: "marble", origin: { x: 10, y: 3 }, radius: 1, restitution: 0.1, slip: 0.5 }
    ]
  };
  const run = simulateContraption(layout, {
    seed: 7,
    durationSeconds: 1,
    stepHz: 240,
    keyframeHz: 30
  });

  assert.equal(resolveRunOutcome({ layout, run }), null);
});

test("grades the shipped WN-17 benchmark layout to a known reason code", () => {
  const run = simulateContraption(CONTRAPTION_BENCHMARK_LAYOUT, {
    seed: 20260807,
    durationSeconds: 4,
    stepHz: 240,
    keyframeHz: 30
  });
  const outcome = resolveRunOutcome({ layout: CONTRAPTION_BENCHMARK_LAYOUT, run });

  assert.notEqual(outcome, null);
  assert.ok(
    ["landed", "short", "long", "perched", "restless"].includes(
      (outcome as NonNullable<typeof outcome>).reason
    ),
    "the benchmark layout must reduce to one of the room-readable reason codes"
  );
});
