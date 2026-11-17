import assert from "node:assert/strict";
import test from "node:test";

import { STICK_DEAD_PX, STICK_RADIUS_PX, resolveStickCentre, resolveStickDir } from "./index.js";

test("does stand still when the thumb is inside the dead zone", () => {
  assert.equal(resolveStickDir(0, 0), 0);
  assert.equal(resolveStickDir(STICK_DEAD_PX - 4, 0), 0);
  assert.equal(resolveStickDir(6, -6), 0);
});

test("does read eight directions clockwise from east, with down the screen toward the camera", () => {
  assert.equal(resolveStickDir(40, 0), 1);
  assert.equal(resolveStickDir(30, 30), 2);
  assert.equal(resolveStickDir(0, 40), 3);
  assert.equal(resolveStickDir(-30, 30), 4);
  assert.equal(resolveStickDir(-40, 0), 5);
  assert.equal(resolveStickDir(-30, -30), 6);
  assert.equal(resolveStickDir(0, -40), 7);
  assert.equal(resolveStickDir(30, -30), 8);
});

test("does keep a thumb that wobbles off an axis on that axis until it is clearly diagonal", () => {
  // Within 22.5 degrees of east is still east.
  assert.equal(resolveStickDir(40, 14), 1);
  assert.equal(resolveStickDir(40, -14), 1);
  assert.equal(resolveStickDir(40, 20), 2);
  assert.equal(resolveStickDir(14, 40), 3);
});

test("does leave the centre where the thumb landed while the thumb is inside the ring", () => {
  assert.deepEqual(resolveStickCentre({ x: 100, y: 100 }, 100 + STICK_RADIUS_PX, 100), { x: 100, y: 100 });
});

test("does drag the centre a radius behind a thumb that outruns the ring", () => {
  const centre = resolveStickCentre({ x: 100, y: 100 }, 100 + STICK_RADIUS_PX + 40, 100);

  assert.deepEqual(centre, { x: 140, y: 100 });
  // So pulling back by one radius is always a turn, however far the thumb wandered.
  assert.equal(resolveStickDir(100 + STICK_RADIUS_PX + 40 - STICK_RADIUS_PX * 2 - centre.x, 0), 5);
});
