import assert from "node:assert/strict";
import test from "node:test";

import {
  formatCountdownFromMilliseconds,
  getRemainingMillisecondsFromEndsAt,
  isLowTimeRemaining
} from "./index";

test("formats countdown values as mm:ss", () => {
  assert.equal(formatCountdownFromMilliseconds(65_000), "01:05");
  assert.equal(formatCountdownFromMilliseconds(0), "00:00");
});

test("clamps countdown remaining milliseconds at zero", () => {
  assert.equal(getRemainingMillisecondsFromEndsAt(1_000, 900), 100);
  assert.equal(getRemainingMillisecondsFromEndsAt(1_000, 1_000), 0);
  assert.equal(getRemainingMillisecondsFromEndsAt(1_000, 1_500), 0);
});

test("reports low-time threshold only for positive values below ten seconds", () => {
  assert.equal(isLowTimeRemaining(9_999), true);
  assert.equal(isLowTimeRemaining(10_000), false);
  assert.equal(isLowTimeRemaining(0), false);
});
