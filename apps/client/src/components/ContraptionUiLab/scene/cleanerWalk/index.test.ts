import assert from "node:assert/strict";
import test from "node:test";

import { hasPickedUp, isStooping, resolveCleanerX } from "./index";

const SCENE_WIDTH = 960;
const REST_X = 700;

test("starts the cleaner off the right edge of the scene", () => {
  assert.equal(resolveCleanerX(0, SCENE_WIDTH, REST_X), SCENE_WIDTH);
});

test("walks the cleaner to the projectile by the time she arrives", () => {
  assert.equal(resolveCleanerX(0.45, SCENE_WIDTH, REST_X), REST_X);
});

test("holds the cleaner beside the projectile while she stoops", () => {
  assert.equal(resolveCleanerX(0.5, SCENE_WIDTH, REST_X), REST_X);
});

// AC#6's completion: the beat ends on an empty floor, not on a character parked mid-scene.
test("walks the cleaner back off the scene once she has picked it up", () => {
  assert.equal(resolveCleanerX(1, SCENE_WIDTH, REST_X), SCENE_WIDTH);
});

test("reports the cleaner as stooping only between arriving and picking up", () => {
  assert.equal(isStooping(0.2), false);
  assert.equal(isStooping(0.5), true);
  assert.equal(isStooping(0.8), false);
});

test("reports nothing picked up before the cleaner has stooped", () => {
  assert.equal(hasPickedUp(0.3), false);
});

test("reports the projectile picked up once the stoop completes", () => {
  assert.equal(hasPickedUp(0.6), true);
});

test("keeps the projectile picked up for the rest of the beat", () => {
  assert.equal(hasPickedUp(1), true);
});
