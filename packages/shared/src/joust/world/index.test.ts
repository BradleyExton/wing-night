import assert from "node:assert/strict";
import test from "node:test";

import {
  JOUST_BODIES,
  JOUST_BODY_COUNT,
  JOUST_CHAMP_BALL_INDICES,
  JOUST_CHAMP_HEAD_INDEX,
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  clampJoustAim,
  readJoustFramePosition,
  resolveJoustHeading,
  resolveJoustLaunchVelocity,
  resolveJoustRestFrame,
  resolveJoustRestPositions,
  resolveJoustSegments
} from "./index.js";

const ARENA = { targetX: 126, obstacles: [{ x: 78, y: 54, width: 6, height: 24 }] };

test("describes every body in the fixed frame order", () => {
  assert.equal(JOUST_BODIES.length, JOUST_BODY_COUNT);
  assert.equal(JOUST_BODIES[JOUST_SHOOTER_HEAD_INDEX]?.kind, "shooter-head");
  assert.equal(JOUST_BODIES[JOUST_CHAMP_HEAD_INDEX]?.kind, "champ-head");
  for (const index of JOUST_SHOOTER_BALL_INDICES) {
    assert.equal(JOUST_BODIES[index]?.kind, "shooter-ball");
  }
  for (const index of JOUST_CHAMP_BALL_INDICES) {
    assert.equal(JOUST_BODIES[index]?.kind, "champ-ball");
  }
});

test("keeps a short pull as-is and caps a long one at the band's radius", () => {
  assert.deepEqual(clampJoustAim({ x: -0.5, y: 0.25 }), { x: -0.5, y: 0.25 });

  const capped = clampJoustAim({ x: -3, y: 0 });

  assert.ok(Math.abs(capped.x + 1) < 1e-9);
  assert.equal(capped.y, 0);
});

test("refuses to pull further down than the shooter's tail can clear the floor", () => {
  const capped = clampJoustAim({ x: -0.2, y: 1 });

  assert.equal(capped.y, JOUST_WORLD.maxPullDown);
  assert.equal(capped.x, -0.2);
});

test("reads a non-finite pull as a slack band", () => {
  assert.deepEqual(clampJoustAim({ x: Number.NaN, y: 0 }), { x: 0, y: 0 });
  assert.deepEqual(clampJoustAim({ x: 0, y: Number.POSITIVE_INFINITY }), { x: 0, y: 0 });
});

test("points the shooter at the champ when the band is slack", () => {
  assert.deepEqual(resolveJoustHeading({ x: 0, y: 0 }), { x: 1, y: 0 });
});

test("flies opposite the pull, faster the further the band is drawn", () => {
  const full = resolveJoustLaunchVelocity({ x: -1, y: 0 });
  const half = resolveJoustLaunchVelocity({ x: -0.5, y: 0 });

  assert.ok(Math.abs(full.x - JOUST_WORLD.maxLaunchSpeed) < 1e-9);
  assert.ok(Math.abs(half.x - JOUST_WORLD.maxLaunchSpeed / 2) < 1e-9);
  assert.equal(Math.abs(full.y), 0);
});

test("stands the champ upright on the floor at the arena's target column", () => {
  const positions = resolveJoustRestPositions(ARENA, { x: 0, y: 0 });
  const head = positions[JOUST_CHAMP_HEAD_INDEX];

  assert.ok(head !== undefined);
  assert.equal(head.x, ARENA.targetX);
  assert.ok(head.y < JOUST_WORLD.floorY - 15, "head should stand well above the floor");
  for (const ballIndex of JOUST_CHAMP_BALL_INDICES) {
    const ball = positions[ballIndex];
    assert.ok(ball !== undefined);
    assert.ok(ball.y > head.y);
  }
});

test("keeps every shooter body above the floor at the deepest allowed pull", () => {
  for (const x of [-1, -0.6, -0.2, 0]) {
    const positions = resolveJoustRestPositions(ARENA, { x, y: 1 });

    for (let index = 0; index <= JOUST_SHOOTER_BALL_INDICES[1]; index += 1) {
      const body = positions[index];
      const radius = JOUST_BODIES[index]?.radius ?? 0;

      assert.ok(body !== undefined);
      assert.ok(
        body.y + radius < JOUST_WORLD.floorY,
        `body ${index} at pull x=${x} sits at ${body.y} with radius ${radius}`
      );
    }
  }
});

test("draws the head back along the pull", () => {
  const rest = resolveJoustRestFrame(ARENA, { x: -1, y: 0 });
  const head = readJoustFramePosition(rest, JOUST_SHOOTER_HEAD_INDEX);

  assert.equal(head.x, JOUST_WORLD.anchor.x - JOUST_WORLD.pullRadius);
  assert.equal(head.y, JOUST_WORLD.anchor.y);
});

test("flattens a frame to two rounded numbers per body", () => {
  const rest = resolveJoustRestFrame(ARENA, { x: -0.333, y: 0.1 });

  assert.equal(rest.length, JOUST_BODY_COUNT * 2);
  for (const value of rest) {
    assert.equal(Math.round(value * 100) / 100, value);
  }
});

test("turns each obstacle into four edges on top of the floor and the back wall", () => {
  assert.equal(resolveJoustSegments(ARENA).length, 2 + 4);
  assert.equal(resolveJoustSegments({ targetX: 120, obstacles: [] }).length, 2);
});
