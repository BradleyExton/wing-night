import assert from "node:assert/strict";
import test from "node:test";

import { resolveFinishPoints, resolveTimeToBeat, resolveTimeoutPoints } from "./index.js";

const rules = { parSeconds: 50, limitSeconds: 100 };

test("does pay the full round at or under par", () => {
  assert.equal(resolveFinishPoints(0, rules, 15), 15);
  assert.equal(resolveFinishPoints(50_000, rules, 15), 15);
});

test("does slide from full points at par to the limit share at the limit", () => {
  assert.equal(resolveFinishPoints(100_000, rules, 20), 2);
  assert.equal(resolveFinishPoints(75_000, rules, 20), 11);
  assert.equal(resolveFinishPoints(200_000, rules, 20), 2);
});

// The whole game is a race, so the slide has to be steep enough that a single
// mistake shows up on the board: four seconds of crash beat costs a point.
test("does cost a point for a four-second crash just past par", () => {
  assert.equal(resolveFinishPoints(54_000, rules, 20), 19);
});

test("does scale the limit share by progress when the limit catches the team", () => {
  assert.equal(resolveTimeoutPoints(24, 24, 20), 2);
  assert.equal(resolveTimeoutPoints(12, 24, 20), 1);
  assert.equal(resolveTimeoutPoints(0, 24, 20), 0);
  assert.equal(resolveTimeoutPoints(5, 0, 20), 0);
});

// The inversion is only worth showing the room if it is exact, so it is tested
// against the very curve it inverts rather than against hand-written seconds:
// the time it names must still pay the target, and one millisecond later must
// not.
test("does name the slowest finish that still beats a rival by a point", () => {
  const pointsMax = 20;

  for (let rivalPoints = 0; rivalPoints < pointsMax; rivalPoints += 1) {
    const timeToBeatMs = resolveTimeToBeat(rivalPoints, rules, pointsMax);

    assert.ok(timeToBeatMs !== null, `no time for ${rivalPoints}`);
    assert.ok(
      resolveFinishPoints(timeToBeatMs, rules, pointsMax) > rivalPoints,
      `${timeToBeatMs}ms does not beat ${rivalPoints}`
    );

    // At the limit there is no later millisecond to check: the relay is over.
    if (timeToBeatMs < rules.limitSeconds * 1000) {
      assert.ok(
        resolveFinishPoints(timeToBeatMs + 1, rules, pointsMax) <= rivalPoints,
        `${timeToBeatMs + 1}ms still beats ${rivalPoints}`
      );
    }
  }
});

test("does hand back the limit when even a finish at the limit beats the rival", () => {
  assert.equal(resolveTimeToBeat(0, rules, 20), 100_000);
});

test("does refuse to name a time when beating the rival needs better than par", () => {
  assert.equal(resolveTimeToBeat(20, rules, 20), null);
  assert.equal(resolveTimeToBeat(21, rules, 20), null);
  assert.equal(resolveTimeToBeat(0, rules, 0), null);
});

test("does keep the named time inside the window between par and the limit", () => {
  const timeToBeatMs = resolveTimeToBeat(19, rules, 20);

  assert.ok(timeToBeatMs !== null);
  assert.ok(timeToBeatMs >= 50_000 && timeToBeatMs <= 100_000);
});
