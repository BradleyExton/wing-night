import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import {
  TABLET_CAMERA,
  TABLET_CAMERA_FIT,
  TV_CAMERA_FIT,
  resolveCamera,
  resolveCameraLead,
  resolveCameraLeadSeconds,
  resolveFillCamera
} from "./index.js";

const TV_ARENA = { width: 1890, height: 847 };

test("keeps the tablet on the sim's own box whatever it is drawn into", () => {
  assert.deepEqual(resolveCamera(TABLET_CAMERA_FIT, TV_ARENA), TABLET_CAMERA);
  assert.deepEqual(resolveCamera(TABLET_CAMERA_FIT, null), TABLET_CAMERA);
});

test("widens a fill camera to the box's aspect and never below its floor", () => {
  assert.equal(resolveCamera(TV_CAMERA_FIT, TV_ARENA).width, 223.14);
  assert.equal(resolveCamera(TV_CAMERA_FIT, TV_ARENA).height, 100);
  // A box narrower than the floor, or no box yet, gets the floor.
  assert.equal(resolveCamera(TV_CAMERA_FIT, { width: 100, height: 100 }).width, 200);
  assert.equal(resolveCamera(TV_CAMERA_FIT, null).width, 200);
  assert.equal(resolveCamera(TV_CAMERA_FIT, { width: 100, height: 0 }).width, 200);
});

test("shows the room more shore ahead of the runner than the tablet sees", () => {
  const tv = resolveCamera(TV_CAMERA_FIT, TV_ARENA);
  const tabletLead = resolveCameraLead(TABLET_CAMERA);

  assert.equal(tabletLead, SCHLONIC_WORLD.width - SCHLONIC_WORLD.runnerX);
  assert.ok(resolveCameraLead(tv) > tabletLead * 1.5);
  // About a second and a half on the tablet against two and a bit on the wall.
  assert.ok(resolveCameraLeadSeconds(TABLET_CAMERA) < 1.5);
  assert.ok(resolveCameraLeadSeconds(tv) > 2.2);
});

test("keeps the runner inside the window on the wall", () => {
  const tv = resolveFillCamera(TV_CAMERA_FIT, TV_ARENA);

  assert.ok(tv.x + SCHLONIC_WORLD.runnerRadius * 2 < SCHLONIC_WORLD.runnerX);
  assert.ok(tv.y <= 0);
  assert.ok(tv.y + tv.height >= SCHLONIC_WORLD.height);
});
