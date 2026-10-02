import assert from "node:assert/strict";
import test from "node:test";

import { WING_DRAW_STEP_TICKS, resolvePickupsSignature } from "./index.js";

test("does draw nothing and cost nothing when no wing is on the street", () => {
  assert.equal(resolvePickupsSignature({ tick: 99, pickups: [] }), "");
});

test("does hold a wing's picture between bob steps and move it on at each step", () => {
  const pickups = [{ x: 42, untilTick: 900 }];

  assert.equal(resolvePickupsSignature({ tick: 8, pickups }), resolvePickupsSignature({ tick: 8 + WING_DRAW_STEP_TICKS - 1, pickups }));
  assert.notEqual(resolvePickupsSignature({ tick: 8, pickups }), resolvePickupsSignature({ tick: 8 + WING_DRAW_STEP_TICKS, pickups }));
  assert.notEqual(resolvePickupsSignature({ tick: 8, pickups }), resolvePickupsSignature({ tick: 8, pickups: [{ x: 50, untilTick: 900 }] }));
});
