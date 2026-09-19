import assert from "node:assert/strict";
import test from "node:test";

import {
  JOUST_LEG_RADIUS,
  JOUST_PERCH_POINTS_MAX,
  JOUST_PIN_FOOT_RADIUS,
  JOUST_SHOOTER_BODY_COUNT,
  JOUST_WORLD,
  isCollapsiblePerch,
  joustLegFootIndex,
  joustLegTopIndex,
  joustPinFootIndex,
  resolveJoustBodies,
  resolveJoustLegs,
  resolveJoustPerchPoints,
  resolveJoustPinPerchIndex,
  resolveJoustRackSlots,
  resolveJoustRestPositions,
  resolveJoustSegments,
  resolvePerchBoxes
} from "./index.js";

const SAND = { x: 54, y: 78, width: 102 };
const SHELF = { x: 116, y: 50, width: 34 };
const HIGH_SHELF = { x: 62, y: 30, width: 32 };
const PERCHES = [SAND, SHELF];

test("does grow two legs under a built shelf and none under the sand", () => {
  const legs = resolveJoustLegs(PERCHES);

  assert.equal(legs.length, 2);
  assert.deepEqual(
    legs.map((leg) => leg.perchIndex),
    [1, 1]
  );
  for (const leg of legs) {
    assert.equal(leg.footY, JOUST_WORLD.floorY - JOUST_LEG_RADIUS);
    assert.ok(leg.topY > SHELF.y && leg.topY < leg.footY);
    assert.ok(leg.x > SHELF.x && leg.x < SHELF.x + SHELF.width);
  }
});

test("does stand each leg where the layout keeps players from standing", () => {
  const legs = resolveJoustLegs(PERCHES);
  const [, ...legBoxes] = resolvePerchBoxes(SHELF);

  assert.deepEqual(
    legs.map((leg) => leg.x),
    legBoxes.map((box) => box.x + box.width / 2)
  );
});

test("does build no legs for a tower already in rubble", () => {
  assert.deepEqual(resolveJoustLegs(PERCHES, [1]), []);
  assert.equal(isCollapsiblePerch(SHELF), true);
  assert.equal(isCollapsiblePerch(SAND), false);
});

test("does put the legs after every pin in the body order", () => {
  const bodies = resolveJoustBodies(3, 2);

  assert.equal(bodies.length, JOUST_SHOOTER_BODY_COUNT + 6 + 4);
  assert.equal(bodies[joustPinFootIndex(2)]?.kind, "pin-foot");
  assert.equal(bodies[joustLegFootIndex(3, 0)]?.kind, "leg-foot");
  assert.equal(bodies[joustLegTopIndex(3, 1)]?.kind, "leg-top");
  assert.equal(joustLegFootIndex(3, 0), JOUST_SHOOTER_BODY_COUNT + 6);
});

test("does rest every leg bolt upright behind the rack", () => {
  const feet = resolveJoustRackSlots(PERCHES, 4);
  const rest = resolveJoustRestPositions(
    { pinFeet: feet, perches: PERCHES, obstacles: [] },
    { x: 0, y: 0 }
  );
  const foot = rest[joustLegFootIndex(feet.length, 0)];
  const top = rest[joustLegTopIndex(feet.length, 0)];

  assert.equal(rest.length, JOUST_SHOOTER_BODY_COUNT + feet.length * 2 + 4);
  assert.ok(foot !== undefined && top !== undefined);
  assert.equal(foot.x, top.x);
  assert.ok(top.y < foot.y);
});

test("does collide the slab as a wall and the legs as nothing at all", () => {
  const standing = resolveJoustSegments({ pinFeet: [], perches: PERCHES, obstacles: [] });
  const rubble = resolveJoustSegments({
    pinFeet: [],
    perches: PERCHES,
    obstacles: [],
    collapsedPerchIndices: [1]
  });

  // Floor, back wall, and the slab's four edges; no leg boxes.
  assert.equal(standing.length, 2 + 4);
  assert.equal(rubble.length, 2);
});

test("does read a pin's perch off where its foot is planted", () => {
  const feet = resolveJoustRackSlots(PERCHES, 4);
  const perchIndices = feet.map((foot) => resolveJoustPinPerchIndex(foot, PERCHES));

  assert.ok(perchIndices.includes(0) && perchIndices.includes(1));
  assert.equal(
    resolveJoustPinPerchIndex({ x: 30, y: JOUST_WORLD.floorY - JOUST_PIN_FOOT_RADIUS }, PERCHES),
    null,
    "bare sand nobody authored is no perch"
  );
});

test("does pay one a head on the sand and more the higher the shelf", () => {
  assert.equal(resolveJoustPerchPoints(null), 1);
  assert.equal(resolveJoustPerchPoints(SAND), 1);
  assert.equal(resolveJoustPerchPoints(SHELF), 2);
  assert.equal(resolveJoustPerchPoints(HIGH_SHELF), JOUST_PERCH_POINTS_MAX);
});
