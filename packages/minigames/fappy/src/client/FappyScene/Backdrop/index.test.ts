import assert from "node:assert/strict";
import test from "node:test";

import { FAR_SKYLINE_PARALLAX, NEAR_SKYLINE_PARALLAX, resolveSkylineTransform } from "./index.js";

const shiftOf = (transform: string): number => Number(transform.match(/calc\(([-\d.]+) \*/)?.[1] ?? Number.NaN);

test("does slide each band at its own fraction of the scroll", () => {
  assert.ok(Math.abs(shiftOf(resolveSkylineTransform(100, "far")) + 100 * FAR_SKYLINE_PARALLAX) < 1e-9);
  assert.ok(Math.abs(shiftOf(resolveSkylineTransform(100, "near")) + 100 * NEAR_SKYLINE_PARALLAX) < 1e-9);
});

test("does wrap a band inside its two tiles however long the leg runs", () => {
  for (const scrollX of [0, 480, 1300, 2600, 9999]) {
    for (const band of ["far", "near"] as const) {
      const shift = -shiftOf(resolveSkylineTransform(scrollX, band));

      assert.ok(shift >= 0 && shift < 300, `${band} at ${scrollX} slid ${shift}`);
    }
  }
});

test("does not open a gap at the left edge when the scene kicks back past zero", () => {
  assert.ok(shiftOf(resolveSkylineTransform(-4, "near")) <= 0);
});
