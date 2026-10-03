import assert from "node:assert/strict";
import test from "node:test";

import { resolveCharacterRagdollRest } from "@wingnight/cast";
import { MOUNT_PARTICLES, MOUNT_WORLD, type MountPose } from "@wingnight/shared";

import { formatRagdollTransform, normaliseDegrees, resolveRagdollTransforms } from "./index.js";

const translatePose = (pose: MountPose, dx: number, dy: number): MountPose => {
  const moved = { ...pose };

  for (const particle of MOUNT_PARTICLES) {
    moved[particle] = { x: pose[particle].x + dx, y: pose[particle].y + dy };
  }

  return moved;
};

const close = (actual: number, expected: number, label: string): void => {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} is not ${expected}`);
};

test("does draw the still hen when the pose is the sim's rest pose", () => {
  const transforms = resolveRagdollTransforms(MOUNT_WORLD.rig.rest);
  const still = resolveCharacterRagdollRest();

  for (const part of Object.keys(still) as (keyof typeof still)[]) {
    close(transforms[part].x, still[part].x, `${part}.x`);
    close(transforms[part].y, still[part].y, `${part}.y`);
    close(transforms[part].rotation, 0, `${part}.rotation`);
  }
});

test("does move every joint and turn nothing when the whole hen is carried", () => {
  const transforms = resolveRagdollTransforms(translatePose(MOUNT_WORLD.rig.rest, -160, -71));
  const still = resolveCharacterRagdollRest();

  for (const part of Object.keys(still) as (keyof typeof still)[]) {
    close(transforms[part].x, still[part].x - 160, `${part}.x`);
    close(transforms[part].y, still[part].y - 71, `${part}.y`);
    close(transforms[part].rotation, 0, `${part}.rotation`);
  }
});

test("does turn a leg clockwise when its foot swings back under the bird", () => {
  const rest = MOUNT_WORLD.rig.rest;
  // The near foot straight out behind the hip: a quarter turn clockwise on screen (y down).
  const pose = { ...rest, footLeft: { x: rest.hipLeft.x - 14, y: rest.hipLeft.y } };

  close(resolveRagdollTransforms(pose).legNear.rotation, 90, "legNear");
});

test("does keep every turn inside a half circle either way", () => {
  assert.equal(normaliseDegrees(270), -90);
  assert.equal(normaliseDegrees(-270), 90);
  assert.equal(normaliseDegrees(180), 180);
  assert.equal(normaliseDegrees(-180), 180);
});

test("does write the transform the cast's own part writes", () => {
  assert.equal(formatRagdollTransform({ x: 1.234, y: -5, rotation: 12.005 }), "translate(1.23 -5) rotate(12.01)");
});
