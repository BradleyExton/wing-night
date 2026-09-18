import assert from "node:assert/strict";
import test from "node:test";

import { hasPickedUp, isStooping, resolveCleanerX } from "./index.js";

test("enters from the right edge and arrives beside the wing", () => {
  assert.equal(resolveCleanerX(0, 960, 700), 960);
  assert.equal(resolveCleanerX(0.45, 960, 700), 700);
});

test("stands still while stooping, then carries the wing back off the same way", () => {
  assert.equal(resolveCleanerX(0.5, 960, 700), 700);
  assert.equal(isStooping(0.5), true);
  assert.equal(hasPickedUp(0.5), false);
  assert.equal(hasPickedUp(0.6), true);
  assert.equal(resolveCleanerX(1, 960, 700), 960);
});

test("clamps progress outside the beat", () => {
  assert.equal(resolveCleanerX(-1, 960, 700), 960);
  assert.equal(resolveCleanerX(2, 960, 700), 960);
  assert.equal(isStooping(2), false);
});
