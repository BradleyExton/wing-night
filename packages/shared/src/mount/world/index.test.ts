import assert from "node:assert/strict";
import test from "node:test";

import { MOUNT_WORLD } from "./index.js";

// `@wingnight/shared` cannot import `@wingnight/cast` (the cast depends on shared), so the hen's
// bones are a copy. Each is pinned here to the literal the cast holds today, with the cast
// constant it copies named beside it, so a change on either side fails a test that says which.
// The cast is the source of truth: when the cast moves, these numbers follow it.

const { rig } = MOUNT_WORLD;

test("does pin every rest particle to the cast's ragdoll joints and tips", () => {
  assert.deepEqual(rig.rest, {
    rump: { x: 20, y: 42 }, // CHARACTER_PIVOTS.tail
    neck: { x: 52, y: 36 }, // CHARACTER_RAGDOLL_SEGMENTS.head.joint (CHARACTER_PIVOTS.head)
    hipLeft: { x: 32, y: 57 }, // CHARACTER_RAGDOLL_SEGMENTS.legNear.joint
    hipRight: { x: 44, y: 57 }, // CHARACTER_RAGDOLL_SEGMENTS.legFar.joint
    footLeft: { x: 32, y: 71 }, // CHARACTER_RAGDOLL_SEGMENTS.legNear.tip
    footRight: { x: 44, y: 71 }, // CHARACTER_RAGDOLL_SEGMENTS.legFar.tip
    wing: { x: 24, y: 55 }, // CHARACTER_RAGDOLL_SEGMENTS.wingNear.tip
    beak: { x: 81, y: 20 }, // CHARACTER_RAGDOLL_SEGMENTS.head.tip (DRAWN_BEAK_TIP)
    wingFar: { x: 28, y: 53 } // CHARACTER_RAGDOLL_SEGMENTS.wingFar.tip
  });
});

test("does pin the torso's fixed points to the cast's body joint and shoulders", () => {
  assert.deepEqual(rig.bodyJoint, { x: 40, y: 45 }); // CHARACTER_RAGDOLL_BODY.joint
  assert.deepEqual(rig.wingRoot, { x: 47, y: 35 }); // CHARACTER_RAGDOLL_SEGMENTS.wingNear.joint
  assert.deepEqual(rig.wingFarRoot, { x: 51, y: 33 }); // CHARACTER_RAGDOLL_SEGMENTS.wingFar.joint
});

test("does pin every bone to the cast's segment length", () => {
  assert.equal(rig.bone.footLeft, 14); // CHARACTER_RAGDOLL_SEGMENTS.legNear.length
  assert.equal(rig.bone.footRight, 14); // CHARACTER_RAGDOLL_SEGMENTS.legFar.length
  assert.equal(rig.bone.wing, 30.479501308256342); // CHARACTER_RAGDOLL_SEGMENTS.wingNear.length, √929
  assert.equal(rig.bone.wingFar, 30.479501308256342); // CHARACTER_RAGDOLL_SEGMENTS.wingFar.length
  assert.equal(rig.bone.beak, 33.12099032335839); // CHARACTER_RAGDOLL_SEGMENTS.head.length, √1097
});

test("does pin the body ball, head ball and crown to the cast's colliders", () => {
  assert.deepEqual(rig.body, { c: { x: 41.5, y: 44 }, r: 23 }); // CHARACTER_RAGDOLL_BODY.centre, .radius
  assert.deepEqual(rig.head, { c: { x: 58, y: 10 }, r: 22 }); // CHARACTER_HEAD_CENTRE, CHARACTER_HEAD_RADIUS
  assert.deepEqual(rig.crown, { x: 58, y: -12 }); // COSTUME_HEAD_ANCHORS.cx, COSTUME_HEAD_ANCHORS.top
});

test("does pin every capsule radius to half the cast's segment thickness", () => {
  assert.deepEqual(rig.radius, {
    footLeft: 1.75, // CHARACTER_RAGDOLL_SEGMENTS.legNear.thickness / 2 (CHARACTER_LEG_STROKE_WIDTH)
    footRight: 1.75, // CHARACTER_RAGDOLL_SEGMENTS.legFar.thickness / 2
    wing: 12, // CHARACTER_RAGDOLL_SEGMENTS.wingNear.thickness / 2
    beak: 12, // CHARACTER_RAGDOLL_SEGMENTS.head.thickness / 2 (DRAWN_HEAD.r)
    wingFar: 12 // CHARACTER_RAGDOLL_SEGMENTS.wingFar.thickness / 2
  });
});

test("does keep every bone exactly as long as its rest pose draws it", () => {
  const length = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
    Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));

  assert.equal(length(rig.rest.hipLeft, rig.rest.footLeft), rig.bone.footLeft);
  assert.equal(length(rig.rest.hipRight, rig.rest.footRight), rig.bone.footRight);
  assert.equal(length(rig.wingRoot, rig.rest.wing), rig.bone.wing);
  assert.equal(length(rig.wingFarRoot, rig.rest.wingFar), rig.bone.wingFar);
  assert.equal(length(rig.rest.neck, rig.rest.beak), rig.bone.beak);
});

test("does stand the start crown 83 units over the toes", () => {
  assert.equal(rig.rest.footRight.y - rig.crown.y, 83);
});

test("does put each goose stance's top at the top of its own shapes", () => {
  for (const stance of ["stand", "honk", "preen"] as const) {
    const { shapes, top } = MOUNT_WORLD.goose[stance];
    const highest = Math.max(
      ...shapes.map((shape) =>
        shape.kind === "circle" ? -shape.c.y + shape.r : Math.max(-shape.a.y, -shape.b.y) + shape.r
      )
    );

    assert.equal(highest, top, stance);
  }

  assert.deepEqual(
    [MOUNT_WORLD.goose.stand.top, MOUNT_WORLD.goose.honk.top, MOUNT_WORLD.goose.preen.top],
    [160, 145, 125]
  );
});

test("does stand the goose on the plinth and keep every goose shape at least minStaticRadius thick", () => {
  const plinthTop = MOUNT_WORLD.plinth.height + MOUNT_WORLD.plinth.edgeRadius;

  for (const stance of ["stand", "honk", "preen"] as const) {
    const [body, ...rest] = MOUNT_WORLD.goose[stance].shapes;

    assert.ok(body?.kind === "circle");
    assert.equal(-body.c.y - body.r, plinthTop, stance);

    for (const shape of [body, ...rest]) {
      assert.ok(shape.r >= MOUNT_WORLD.minStaticRadius, stance);
    }
  }
});

test("does keep maxSpeed below the thinnest pair of colliders that can meet, a leg against a stuck leg", () => {
  assert.ok(MOUNT_WORLD.maxSpeed < rig.radius.footLeft + MOUNT_WORLD.minStaticRadius);
});
