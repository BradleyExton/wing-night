import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { JoustPerch } from "../types.js";
import {
  JOUST_LEG_RADIUS,
  JOUST_PERCH_POINTS_MAX,
  JOUST_PIN_FOOT_RADIUS,
  JOUST_PIN_HEAD_RADIUS,
  JOUST_PIN_SPACING,
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
  resolveJoustRackLayout,
  resolveJoustRackSlots,
  resolveJoustRestPositions,
  resolveJoustSegments,
  resolveLaneSlots,
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

/**
 * The lanes a party actually plays. A lane is authored as SHELVES and the rack is however many
 * players are not on the shooting team, so the two only meet here — which is exactly where a lane
 * that seats too few goes wrong, silently, in front of the room.
 */
const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));
const SHIPPED_LANES = (
  JSON.parse(
    readFileSync(
      join(MODULE_ROOT, "..", "..", "..", "..", "..", "content/sample/minigames/joust.json"),
      "utf8"
    )
  ) as { prompts: { id: string; name: string; perches: JoustPerch[] }[] }
).prompts;

/**
 * The widest rack a lane has to hold: a fifteen-player roster split into teams of three leaves
 * twelve opponents standing, and the shipped lanes carry headroom above that.
 */
const REALISTIC_PIN_COUNTS = [9, 10, 11, 12, 13, 14] as const;

/** What the whole rack is worth to the team shooting at it, read off the geometry like the scorer. */
const availablePoints = (perches: readonly JoustPerch[], pinCount: number): number => {
  const layout = resolveJoustRackLayout(perches, pinCount);

  return layout.feet.reduce((total, foot) => {
    const perchIndex = resolveJoustPinPerchIndex(foot, layout.perches);

    return total + resolveJoustPerchPoints(perchIndex === null ? null : layout.perches[perchIndex]);
  }, 0);
};

test("does seat a realistic roster on the lane's own perches when the lane is one we ship", () => {
  for (const lane of SHIPPED_LANES) {
    const capacity = resolveLaneSlots(lane.perches).reduce((total, slots) => total + slots.length, 0);

    assert.ok(
      capacity >= 14,
      `${lane.name} seats only ${capacity}; a lane must hold 14 so a three-player team's twelve opponents keep their perches`
    );

    for (const pinCount of REALISTIC_PIN_COUNTS) {
      const layout = resolveJoustRackLayout(lane.perches, pinCount);

      assert.equal(layout.feet.length, pinCount, `${lane.name} lost players at ${pinCount}`);
      assert.deepEqual(
        layout.perches,
        lane.perches,
        `${lane.name} fell back to bare ground at ${pinCount} pins — every perch in the lane would vanish`
      );
    }
  }
});

test("does keep every bird a head clear of its neighbour when a shipped lane is racked", () => {
  for (const lane of SHIPPED_LANES) {
    for (const pinCount of REALISTIC_PIN_COUNTS) {
      const feet = resolveJoustRackLayout(lane.perches, pinCount).feet;

      for (let index = 0; index < feet.length; index += 1) {
        for (let other = index + 1; other < feet.length; other += 1) {
          const here = feet[index];
          const there = feet[other];

          if (here === undefined || there === undefined || Math.abs(here.y - there.y) > 0.001) {
            continue;
          }

          assert.ok(
            Math.abs(here.x - there.x) >= JOUST_PIN_SPACING - 0.001,
            `${lane.name} dealt two birds ${Math.abs(here.x - there.x)} apart at ${pinCount} pins; a head alone is ${JOUST_PIN_HEAD_RADIUS * 2}`
          );
        }
      }
    }
  }
});

test("does pay the four shipped lanes alike when the turn order picks between them", () => {
  // Lanes are dealt by turn position, so a richer lane is a seating-order advantage nobody chose.
  for (const pinCount of REALISTIC_PIN_COUNTS) {
    const points = SHIPPED_LANES.map((lane) => availablePoints(lane.perches, pinCount));
    const spread = Math.max(...points) - Math.min(...points);

    assert.ok(
      spread <= 1,
      `at ${pinCount} pins the lanes pay ${points.join(", ")} — a spread of ${spread} is a prize for going first`
    );
  }
});

test("does crowd the whole rack onto bare sand when a lane cannot seat it", () => {
  // The trap the shipped lanes are sized to stay out of: one shelf too few and every perch in the
  // lane is replaced by a single row, so the towers stop paying and stop being drawn on.
  const narrow: JoustPerch[] = [
    { x: 54, y: JOUST_WORLD.floorY, width: 40 },
    { x: 100, y: 56, width: 20 }
  ];
  const layout = resolveJoustRackLayout(narrow, 12);

  assert.equal(layout.feet.length, 12);
  assert.notDeepEqual(layout.perches, narrow);
  assert.equal(layout.perches.length, 1);
  assert.equal(availablePoints(narrow, 12), 12, "every bird on the sand is worth one");
});
