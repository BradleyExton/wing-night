import assert from "node:assert/strict";
import test from "node:test";

import { formatClimbClock, isLastTen } from "./index.js";

test("does round a part second up when the clock is read", () => {
  assert.equal(formatClimbClock(1800), "0:30");
  assert.equal(formatClimbClock(1799), "0:30");
  assert.equal(formatClimbClock(3660), "1:01");
  assert.equal(formatClimbClock(-5), "0:00");
});

test("does flag the last ten seconds only while the clock still runs", () => {
  assert.equal(isLastTen(601), false);
  assert.equal(isLastTen(600), true);
  assert.equal(isLastTen(1), true);
  assert.equal(isLastTen(0), false);
});
