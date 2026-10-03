import assert from "node:assert/strict";
import test from "node:test";

import { MOUNT_PARTICLES, MOUNT_WORLD, createMountPile, type MountPile, type MountPose } from "@wingnight/shared";

import {
  FIT_MIN_HEIGHT,
  GROUND_SHOWN,
  easeCamera,
  formatMountCamera,
  resolveFitCamera,
  resolveFollowCamera,
  resolveMountExtent,
  resolveTorsoCentre,
  resolveViewBox
} from "./index.js";

const translatePose = (pose: MountPose, dx: number, dy: number): MountPose => {
  const moved = { ...pose };

  for (const particle of MOUNT_PARTICLES) {
    moved[particle] = { x: pose[particle].x + dx, y: pose[particle].y + dy };
  }

  return moved;
};

// A pile with one hen frozen high above the goose: a mountain taller than the tablet's view.
const tallPile = (): MountPile => {
  const pile = createMountPile(20261002);
  const pose = translatePose(MOUNT_WORLD.rig.rest, -40, -420);

  return {
    ...pile,
    hens: [{ pileIndex: 0, playerId: "player-1", pose, grabs: {}, mounted: true }],
    highLine: { height: 440, x: 18, playerId: "player-1" }
  };
};

test("does frame the sim's own 240 by 150 box when the tablet is 16:10", () => {
  const camera = resolveFollowCamera({ x: 0, y: -200 }, 16 / 10);

  assert.equal(camera.width, 240);
  assert.equal(camera.height, 150);
  assert.equal(camera.x, -120);
  assert.equal(camera.y, -275);
});

test("does widen the close-up rather than stretch it when the box is wider than 16:10", () => {
  const camera = resolveFollowCamera({ x: 0, y: -200 }, 2);

  assert.equal(camera.height, 150);
  assert.equal(camera.width, 300);
});

test("does hold the floor at the bottom edge when the climber stands on it", () => {
  const camera = resolveFollowCamera(resolveTorsoCentre(MOUNT_WORLD.rig.rest), 16 / 10);

  assert.equal(camera.y + camera.height, GROUND_SHOWN);
});

test("does cover the whole pile and the line when the room frames a mountain", () => {
  const pile = tallPile();
  const camera = resolveFitCamera(resolveMountExtent(pile, []), 16 / 9);

  assert.ok(camera.y <= -440, `the line at 440 is above the camera's top ${camera.y}`);
  assert.ok(camera.y + camera.height >= 0, "the floor is in frame");
  assert.ok(camera.x <= -76 && camera.x + camera.width >= 76, "the plinth is in frame");
  assert.ok(Math.abs(camera.width / camera.height - 16 / 9) < 1e-9, "the camera keeps the box's aspect");
});

test("does keep the room's camera at least 220 tall when the pile is only the goose", () => {
  const camera = resolveFitCamera(resolveMountExtent(createMountPile(20261002), []), 16 / 9);

  assert.ok(camera.height >= FIT_MIN_HEIGHT);
  assert.equal(camera.y + camera.height, GROUND_SHOWN);
});

test("does take in the climber when it is off to one side of the pile", () => {
  const climber = translatePose(MOUNT_WORLD.rig.rest, -400, -71);
  const camera = resolveFitCamera(resolveMountExtent(createMountPile(20261002), [climber]), 16 / 9);

  assert.ok(camera.x <= climber.rump.x);
});

test("does move a share of the way when the camera eases", () => {
  const eased = easeCamera({ x: 0, y: 0, width: 100, height: 100 }, { x: 10, y: -10, width: 200, height: 50 }, 0.5);

  assert.deepEqual(eased, { x: 5, y: -5, width: 150, height: 75 });
});

test("does write the camera as whole units for the harness and as a viewBox for the drawing", () => {
  const camera = { x: -120.4, y: -136.5, width: 240, height: 150.004 };

  assert.equal(formatMountCamera(camera), "-120 -136 240 150");
  assert.equal(resolveViewBox(camera), "-120.4 -136.5 240 150");
});
