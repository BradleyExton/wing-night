import assert from "node:assert/strict";
import test from "node:test";

import { resolveRecreateTargetNumber } from "./index.js";

test("does count the target being written when nothing is scored yet", () => {
  assert.equal(resolveRecreateTargetNumber("writing", 0, 2), 1);
  assert.equal(resolveRecreateTargetNumber("judging", 0, 2), 1);
  assert.equal(resolveRecreateTargetNumber("writing", 1, 2), 2);
});

test("does hold the count on the scored target while its reveal is still up", () => {
  // The seal and the real prompt for target one are on the tablet until the
  // host taps "Next target" — the header read "Target 2 of 2" over them.
  assert.equal(resolveRecreateTargetNumber("scored", 1, 2), 1);
  assert.equal(resolveRecreateTargetNumber("scored", 2, 2), 2);
});

test("does stay inside the turn when the targets are spent", () => {
  assert.equal(resolveRecreateTargetNumber("scored", 1, 1), 1);
  assert.equal(resolveRecreateTargetNumber("writing", 3, 3), 3);
});
