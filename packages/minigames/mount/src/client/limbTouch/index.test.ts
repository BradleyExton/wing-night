import assert from "node:assert/strict";
import test from "node:test";

import { MOUNT_WORLD } from "@wingnight/shared";

import { isMoveDue, pickMountLimb, quantiseMountPoint } from "./index.js";

const rest = MOUNT_WORLD.rig.rest;

test("does snap a finger to the input grid when it is logged", () => {
  assert.deepEqual(quantiseMountPoint({ x: 1.1, y: -2.9 }), { x: 1.125, y: -2.875 });
});

test("does take the nearest tip when a touch lands between two feet", () => {
  assert.equal(pickMountLimb({ x: rest.footRight.x - 1, y: rest.footRight.y }, rest, new Set()), "footRight");
  assert.equal(pickMountLimb({ x: rest.footLeft.x + 1, y: rest.footLeft.y }, rest, new Set()), "footLeft");
});

test("does pass over a limb another finger owns when the touch could take either", () => {
  const between = { x: (rest.footLeft.x + rest.footRight.x) / 2, y: rest.footLeft.y };

  assert.equal(pickMountLimb(between, rest, new Set(["footLeft"])), "footRight");
});

test("does take nothing when the touch is out of every tip's reach", () => {
  assert.equal(pickMountLimb({ x: rest.beak.x + MOUNT_WORLD.touchRadius + 1, y: rest.beak.y }, rest, new Set()), null);
});

test("does allow one move per limb every second tick", () => {
  assert.equal(isMoveDue(null, 0), true);
  assert.equal(isMoveDue(10, 11), false);
  assert.equal(isMoveDue(10, 12), true);
});
