import assert from "node:assert/strict";
import test from "node:test";

import {
  JOUST_PIN_HEAD_RADIUS,
  JOUST_PIN_HEIGHT,
  JOUST_RACK_LEFT,
  JOUST_RACK_RIGHT,
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  clampJoustAim,
  joustPinFootIndex,
  joustPinHeadIndex,
  readJoustFramePosition,
  resolveJoustBodies,
  resolveJoustHeading,
  resolveJoustLaunchVelocity,
  resolveJoustPinTilt,
  resolveJoustRackLayout,
  resolveJoustRackSlots,
  resolveJoustRestFrame,
  resolveJoustRestPositions,
  resolveJoustSegments,
  resolvePerchBoxes
} from "./index.js";

const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];
const ARENA = {
  pinFeet: resolveJoustRackSlots(PERCHES, 3),
  perches: PERCHES,
  obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
};

test("describes the shooter then one foot/head pair per pin", () => {
  const bodies = resolveJoustBodies(3);

  assert.equal(bodies.length, JOUST_SHOOTER_BODY_COUNT + 6);
  assert.equal(bodies[JOUST_SHOOTER_HEAD_INDEX]?.kind, "shooter-head");
  for (const index of JOUST_SHOOTER_BALL_INDICES) {
    assert.equal(bodies[index]?.kind, "shooter-ball");
  }
  for (let pinIndex = 0; pinIndex < 3; pinIndex += 1) {
    assert.equal(bodies[joustPinFootIndex(pinIndex)]?.kind, "pin-foot");
    assert.equal(bodies[joustPinHeadIndex(pinIndex)]?.kind, "pin-head");
  }
});

test("drops the pin bodies entirely when the rack has been cleared", () => {
  assert.equal(resolveJoustBodies(0).length, JOUST_SHOOTER_BODY_COUNT);
});

test("deals the rack across the lane's perches", () => {
  const slots = resolveJoustRackSlots(PERCHES, 8);
  const onShelf = slots.filter((slot) => slot.y < JOUST_WORLD.floorY - 10);

  assert.equal(slots.length, 8);
  assert.ok(onShelf.length > 0, "a lane with a shelf should stand somebody on it");
  assert.ok(onShelf.length < slots.length, "and should not put everybody up there");
});

// Birds dealt closer together than their own heads are wide shove each other over on the first
// step, and the rack comes down before the shot is fired. This is what stops that, at every
// roster size a night could produce.
test("never stands two players closer than a head's width apart", () => {
  for (const count of [2, 5, 8, 11, 14]) {
    const { feet } = resolveJoustRackLayout(PERCHES, count);

    assert.equal(feet.length, count, `${count} players must all get somewhere to stand`);

    for (const [index, slot] of feet.entries()) {
      for (const other of feet.slice(index + 1)) {
        const apart = Math.sqrt((slot.x - other.x) ** 2 + (slot.y - other.y) ** 2);

        assert.ok(
          apart >= JOUST_PIN_HEAD_RADIUS * 2,
          `${count} players put two ${apart.toFixed(1)} apart`
        );
      }
    }
  }
});

// The layout hands back the structures it actually used, so this holds even when a rack too big
// for the shelves has been stood on the bare sand instead.
test("never stands a player inside the lane's own timber", () => {
  for (const count of [5, 11, 14]) {
    const layout = resolveJoustRackLayout(PERCHES, count);
    const timber = layout.perches.flatMap(resolvePerchBoxes);

    for (const slot of layout.feet) {
      for (const box of timber) {
        const insideX =
          slot.x + JOUST_PIN_HEAD_RADIUS > box.x &&
          slot.x - JOUST_PIN_HEAD_RADIUS < box.x + box.width;
        const insideY = slot.y > box.y && slot.y - JOUST_PIN_HEIGHT < box.y + box.height;

        assert.ok(!(insideX && insideY), `${count} players put one inside ${JSON.stringify(box)}`);
      }
    }
  }
});

test("takes the shelves away when the rack is too big for them", () => {
  const roomy = resolveJoustRackLayout(PERCHES, 8);
  const crowded = resolveJoustRackLayout(PERCHES, 14);

  assert.deepEqual(roomy.perches, PERCHES);
  assert.equal(crowded.perches.length, 1, "a rack that will not fit stands on the bare sand");
  assert.ok(crowded.feet.every((slot) => slot.y > JOUST_WORLD.floorY - 10));
});

test("keeps the whole rack inside the lane", () => {
  for (const slot of resolveJoustRackSlots(PERCHES, 11)) {
    assert.ok(slot.x >= JOUST_RACK_LEFT - 1e-9 && slot.x <= JOUST_RACK_RIGHT + 1e-9);
  }
});

test("stands nobody anywhere when there is nobody to stand", () => {
  assert.deepEqual(resolveJoustRackSlots(PERCHES, 0), []);
  assert.equal(resolveJoustRackSlots([], 4).length, 4, "a lane with no shelves still has sand");
});

test("grows a shelf its own slab and legs, and leaves the sand bare", () => {
  const shelf = resolvePerchBoxes({ x: 116, y: 50, width: 34 });

  assert.equal(shelf.length, 3, "a slab and two legs");
  assert.equal(shelf[0]?.y, 50);
  for (const leg of shelf.slice(1)) {
    assert.equal(leg.y + leg.height, JOUST_WORLD.floorY, "legs reach the sand");
  }
  assert.deepEqual(resolvePerchBoxes({ x: 54, y: JOUST_WORLD.floorY, width: 102 }), []);
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

test("points the shooter down the lane when the band is slack", () => {
  assert.deepEqual(resolveJoustHeading({ x: 0, y: 0 }), { x: 1, y: 0 });
});

test("flies opposite the pull, faster the further the band is drawn", () => {
  const full = resolveJoustLaunchVelocity({ x: -1, y: 0 });
  const half = resolveJoustLaunchVelocity({ x: -0.5, y: 0 });

  assert.ok(Math.abs(full.x - JOUST_WORLD.maxLaunchSpeed) < 1e-9);
  assert.ok(Math.abs(half.x - JOUST_WORLD.maxLaunchSpeed / 2) < 1e-9);
  assert.equal(Math.abs(full.y), 0);
});

test("stands every pin bolt upright on its own spot, floor or shelf", () => {
  const positions = resolveJoustRestPositions(ARENA, { x: 0, y: 0 });

  for (const [pinIndex, spot] of ARENA.pinFeet.entries()) {
    const foot = positions[joustPinFootIndex(pinIndex)];
    const head = positions[joustPinHeadIndex(pinIndex)];

    assert.ok(foot !== undefined && head !== undefined);
    assert.deepEqual(foot, spot);
    assert.equal(head.x, spot.x);
    assert.equal(resolveJoustPinTilt(foot, head), 0);
    assert.ok(Math.abs(foot.y - head.y - JOUST_PIN_HEIGHT) < 1e-9);
  }
});

test("reads a pin laid flat on the sand as fully over", () => {
  const foot = { x: 100, y: 76.5 };
  const head = { x: 100 + JOUST_PIN_HEIGHT, y: 76.5 };

  assert.ok(Math.abs(resolveJoustPinTilt(foot, head) - 1) < 1e-9);
});

test("keeps every shooter body above the floor at the deepest allowed pull", () => {
  const bodies = resolveJoustBodies(ARENA.pinFeet.length);

  for (const x of [-1, -0.6, -0.2, 0]) {
    const positions = resolveJoustRestPositions(ARENA, { x, y: 1 });

    for (let index = 0; index < JOUST_SHOOTER_BODY_COUNT; index += 1) {
      const body = positions[index];
      const radius = bodies[index]?.radius ?? 0;

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

  assert.equal(rest.length, (JOUST_SHOOTER_BODY_COUNT + ARENA.pinFeet.length * 2) * 2);
  for (const value of rest) {
    assert.equal(Math.round(value * 100) / 100, value);
  }
});

test("turns each obstacle and every piece of perch timber into edges", () => {
  const bare = { pinFeet: [{ x: 120, y: 76.4 }], perches: [], obstacles: [] };
  const timberCount = PERCHES.flatMap(resolvePerchBoxes).length;

  assert.equal(resolveJoustSegments(bare).length, 2);
  assert.equal(resolveJoustSegments(ARENA).length, 2 + (timberCount + 1) * 4);
});
