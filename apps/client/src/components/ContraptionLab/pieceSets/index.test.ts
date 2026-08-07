import { simulateContraption } from "@wingnight/shared";
import assert from "node:assert/strict";
import test from "node:test";

import { resolveBucket, resolveRunOutcome } from "../runOutcome/index";
import { DEFAULT_PIECE_SET_ID, LAB_PIECE_SETS, resolvePieceSet } from "./index";

// The authored sets carry a promise the lab depends on: each is a SOLVED route. A set that stops
// landing turns the piece-count question into "why is this broken", so the promise is asserted
// rather than left as a comment.

const AUTHORED_SET_IDS = ["two", "four", "six"] as const;

const runOf = (id: string) => {
  const pieceSet = resolvePieceSet(id);
  const run = simulateContraption(pieceSet.layout, {
    seed: 7,
    durationSeconds: 6,
    stepHz: 240,
    keyframeHz: 30
  });

  return { pieceSet, outcome: resolveRunOutcome({ layout: pieceSet.layout, run }) };
};

for (const id of AUTHORED_SET_IDS) {
  test(`lands the wing when the ${id}-piece route runs unmodified`, () => {
    const { outcome } = runOf(id);

    assert.notEqual(outcome, null);
    assert.equal(outcome?.reason, "landed");
  });

  test(`settles inside the 4s watchable window when the ${id}-piece route runs`, () => {
    const { outcome } = runOf(id);

    assert.notEqual(outcome?.settleSeconds, null);
    assert.ok(
      (outcome?.settleSeconds as number) <= 4,
      `${id} settles at ${String(outcome?.settleSeconds)}s, past WN-15's 4s target`
    );
  });
}

// Regression for the claim this module makes about itself. An earlier revision picked its routes
// with a proximity test (within ~1.2 units of a ramp) and shipped a "2-piece" set whose second ramp
// the wing never touched — a spectator, not a route step, which would have silently made the
// piece-count question unanswerable. Contact is now checked at every integration step.
const CONTACT_SLACK = 0.05;

const distanceToSegment = (
  point: { x: number; y: number },
  segment: { from: { x: number; y: number }; to: { x: number; y: number } }
): number => {
  const alongX = segment.to.x - segment.from.x;
  const alongY = segment.to.y - segment.from.y;
  const lengthSquared = alongX * alongX + alongY * alongY;
  const offsetX = point.x - segment.from.x;
  const offsetY = point.y - segment.from.y;
  const travel =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (offsetX * alongX + offsetY * alongY) / lengthSquared));
  const gapX = point.x - (segment.from.x + alongX * travel);
  const gapY = point.y - (segment.from.y + alongY * travel);

  return Math.sqrt(gapX * gapX + gapY * gapY);
};

for (const id of AUTHORED_SET_IDS) {
  test(`contacts every placed ramp when the ${id}-piece route runs`, () => {
    const pieceSet = resolvePieceSet(id);
    // Sampled at the integration rate: a fast wing clears a ramp between two 30Hz keyframes.
    const stepRun = simulateContraption(pieceSet.layout, {
      seed: 7,
      durationSeconds: 6,
      stepHz: 240,
      keyframeHz: 240
    });
    const wing = pieceSet.layout.bodies[0];
    const ramps = pieceSet.layout.segments.filter((segment) => segment.id.startsWith("ramp-"));

    assert.equal(ramps.length, pieceSet.pieceCount);

    for (const placed of ramps) {
      const contacted = stepRun.keyframes.some(
        (keyframe) => distanceToSegment(keyframe[0], placed) <= wing.radius + CONTACT_SLACK
      );

      assert.ok(contacted, `${id}: the wing never touches ${placed.id}`);
    }
  });
}

test("counts only the placed ramps when reporting a set's piece count", () => {
  // The frame — floor, two walls, two bucket walls — is scenery and must not inflate the count.
  const four = resolvePieceSet("four");

  assert.equal(four.pieceCount, 4);
  assert.equal(four.layout.segments.length, 5 + 4);
});

test("nests the smaller routes inside the larger ones so only the count varies", () => {
  const two = resolvePieceSet("two").layout.segments.map((segment) => segment.id);
  const six = resolvePieceSet("six").layout.segments.map((segment) => segment.id);

  for (const id of two) {
    assert.ok(six.includes(id), `expected the 6-piece set to keep ${id}`);
  }
});

test("gives every set a gradeable bucket so the outcome reason is never indeterminate", () => {
  for (const pieceSet of LAB_PIECE_SETS) {
    assert.notEqual(
      resolveBucket(pieceSet.layout),
      null,
      `${pieceSet.id} has no bucket to grade against`
    );
  }
});

test("falls back to the first set when the requested id is unknown", () => {
  assert.equal(resolvePieceSet("nope").id, DEFAULT_PIECE_SET_ID);
});
