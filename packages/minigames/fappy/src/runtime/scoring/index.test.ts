import assert from "node:assert/strict";
import test from "node:test";

import { resolveFinishPoints, resolveTimeoutPoints } from "./index.js";

const rules = { parSeconds: 45, limitSeconds: 120 };

test("does pay the full round at or under par", () => {
  assert.equal(resolveFinishPoints(0, rules, 15), 15);
  assert.equal(resolveFinishPoints(45_000, rules, 15), 15);
});

test("does slide from full points at par to a quarter at the limit", () => {
  assert.equal(resolveFinishPoints(120_000, rules, 20), 5);
  assert.equal(resolveFinishPoints(82_500, rules, 20), 13);
  assert.equal(resolveFinishPoints(200_000, rules, 20), 5);
});

test("does scale the limit share by progress when the limit catches the team", () => {
  assert.equal(resolveTimeoutPoints(32, 32, 20), 5);
  assert.equal(resolveTimeoutPoints(16, 32, 20), 3);
  assert.equal(resolveTimeoutPoints(0, 32, 20), 0);
  assert.equal(resolveTimeoutPoints(5, 0, 20), 0);
});
