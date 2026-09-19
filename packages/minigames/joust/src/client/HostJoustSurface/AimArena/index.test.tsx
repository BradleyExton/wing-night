import assert from "node:assert/strict";
import test from "node:test";

import { JOUST_WORLD } from "@wingnight/shared";

import { JOUST_MIN_LAUNCH_PULL } from "../../../runtime/types/index.js";
import { resolveAimFromPointer, type AimArenaBounds } from "./index.js";

// An arena drawn at exactly world scale with no letterboxing, so a client point IS a world point.
const BOUNDS: AimArenaBounds = {
  left: 0,
  top: 0,
  width: JOUST_WORLD.width,
  height: JOUST_WORLD.height
};

const magnitude = (aim: { x: number; y: number }): number => {
  return Math.sqrt(aim.x * aim.x + aim.y * aim.y);
};

test("does read a point behind the fork as a pull back along the band", () => {
  const aim = resolveAimFromPointer(BOUNDS, JOUST_WORLD.anchor.x - 7, JOUST_WORLD.anchor.y + 3.5);

  assert.ok(Math.abs(aim.x + 0.5) < 1e-9, "half the band's radius back");
  assert.ok(Math.abs(aim.y - 0.25) < 1e-9, "a quarter of it down");
});

test("does cap a pull dragged past the band's own radius", () => {
  const aim = resolveAimFromPointer(BOUNDS, JOUST_WORLD.anchor.x - 90, JOUST_WORLD.anchor.y);

  assert.ok(Math.abs(aim.x + 1) < 1e-9);
});

// A tablet on a table takes stray touches all night. Pinning only the pull's x left a tap down the
// lane reading as a full-power pull straight up — which fires, and spends that player's only shot.
test("does go slack for a tap on the rack's side of the fork rather than spending a shot", () => {
  for (const [x, y] of [
    [120, 30],
    [140, JOUST_WORLD.floorY - 4],
    [JOUST_WORLD.anchor.x, 10]
  ]) {
    const aim = resolveAimFromPointer(BOUNDS, x ?? 0, y ?? 0);

    assert.deepEqual(aim, { x: 0, y: 0 }, `a touch at ${x}, ${y} is pointing, not pulling`);
    assert.ok(magnitude(aim) < JOUST_MIN_LAUNCH_PULL);
  }
});

test("does still fire a near-vertical pull drawn a hair behind the fork", () => {
  const aim = resolveAimFromPointer(BOUNDS, JOUST_WORLD.anchor.x - 0.5, JOUST_WORLD.anchor.y + 14);

  assert.ok(aim.x < 0);
  assert.ok(magnitude(aim) >= JOUST_MIN_LAUNCH_PULL, "a lob straight up is still a shot");
});

test("does map a pointer back through the letterboxing when the arena is not 16:9", () => {
  // Twice the world's width at the same height: the scene is drawn centred at the height's scale.
  const wide: AimArenaBounds = {
    left: 40,
    top: 10,
    width: JOUST_WORLD.width * 2,
    height: JOUST_WORLD.height
  };
  const aim = resolveAimFromPointer(
    wide,
    40 + JOUST_WORLD.width / 2 + (JOUST_WORLD.anchor.x - JOUST_WORLD.pullRadius),
    10 + JOUST_WORLD.anchor.y
  );

  assert.ok(Math.abs(aim.x + 1) < 1e-9, "a full pull back, wherever the box put it");
  assert.ok(Math.abs(aim.y) < 1e-9);
});
