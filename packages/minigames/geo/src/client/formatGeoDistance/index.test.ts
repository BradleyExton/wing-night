import assert from "node:assert/strict";
import test from "node:test";

import { formatGeoDistance } from "./index.js";

test("reads in metres when the pin lands inside a kilometre", () => {
  assert.deepEqual(formatGeoDistance(0.88), { value: "880", unit: "m" });
  assert.deepEqual(formatGeoDistance(0.0004), { value: "0", unit: "m" });
});

test("keeps one decimal while the miss is still close", () => {
  assert.deepEqual(formatGeoDistance(7.7), { value: "7.7", unit: "km" });
  assert.deepEqual(formatGeoDistance(99.94), { value: "99.9", unit: "km" });
});

// A decimal point on a four-digit number is noise from eight feet away, and
// the separator is what makes the magnitude readable at a glance.
test("groups the thousands once the guess is a continent out", () => {
  assert.deepEqual(formatGeoDistance(100), { value: "100", unit: "km" });
  assert.deepEqual(formatGeoDistance(5903.6), { value: "5,904", unit: "km" });
});
