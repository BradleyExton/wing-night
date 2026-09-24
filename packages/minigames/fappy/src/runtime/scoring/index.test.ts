import assert from "node:assert/strict";
import test from "node:test";

import { resolveFinishPoints, resolveTimeoutPoints } from "./index.js";

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
