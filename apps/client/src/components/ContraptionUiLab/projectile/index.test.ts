import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROJECTILE_ID,
  PROJECTILES,
  requiresAngularVelocity,
  resolveProjectileMeta
} from "./index";

// AC#5 requires BOTH candidates be shown so the call can be made on sight. A lab that quietly
// dropped one would still render fine, so pin the pair.
test("offers both projectile candidates so the call can be made on sight", () => {
  const ids = PROJECTILES.map((projectile) => projectile.id);

  assert.deepEqual([...ids].sort(), ["drumette", "wing-bone"]);
});

test("records the drumette as reading correctly without rotation", () => {
  assert.equal(resolveProjectileMeta("drumette").readsCorrectlyWithoutRotation, true);
});

test("records the flat wing bone as not reading correctly without rotation", () => {
  assert.equal(resolveProjectileMeta("wing-bone").readsCorrectlyWithoutRotation, false);
});

// The implication the ticket flags for WN-15's scope: rotation becomes new physics in the WN-23
// module ONLY if the flat shape wins. Pinning both directions keeps the lab from drifting into
// asserting that rotation is needed outright.
test("reports that angular velocity is needed when the flat bone is the projectile", () => {
  assert.equal(requiresAngularVelocity("wing-bone"), true);
});

test("reports that angular velocity is not needed when the drumette is the projectile", () => {
  assert.equal(requiresAngularVelocity("drumette"), false);
});

test("defaults to the projectile that needs no new physics", () => {
  assert.equal(requiresAngularVelocity(DEFAULT_PROJECTILE_ID), false);
});
