import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { JOUST_OBSTACLE_KINDS } from "../../joust/types.js";
import type { JoustPerch } from "../../joust/types.js";
import { resolveLaneSlots } from "../../joust/world/index.js";
import {
  JOUST_MAX_PERCH_X,
  JOUST_MIN_LANE_CAPACITY,
  JOUST_MIN_PERCH_X,
  isJoustContentFile,
  validateJoustContentFile,
  validateJoustPrompt
} from "./index.js";

// The shipped Lookout, shelf for shelf: a lane that clears the seating floor, so every other
// assertion here is about the thing it is testing rather than about capacity.
const validPrompt = {
  id: "arena-1",
  name: "The Lookout",
  perches: [
    { x: 54, y: 78, width: 102 },
    { x: 57, y: 52, width: 58 },
    { x: 129, y: 40, width: 22 }
  ],
  obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
};

const MODULE_ROOT = dirname(fileURLToPath(import.meta.url));
const SHIPPED_LANES = (
  JSON.parse(
    readFileSync(
      join(MODULE_ROOT, "..", "..", "..", "..", "..", "content/sample/minigames/joust.json"),
      "utf8"
    )
  ) as { prompts: { id: string; perches: JoustPerch[] }[] }
).prompts;

const laneCapacity = (perches: readonly JoustPerch[]): number => {
  return resolveLaneSlots(perches).reduce((total, slots) => total + slots.length, 0);
};

test("accepts a lane with perches in range and well-formed props", () => {
  assert.deepEqual(validateJoustPrompt(validPrompt), []);
  assert.equal(isJoustContentFile({ prompts: [validPrompt] }), true);
});

test("does accept every prop kind the renderer can dress an obstacle as", () => {
  for (const kind of JOUST_OBSTACLE_KINDS) {
    assert.deepEqual(
      validateJoustPrompt({ ...validPrompt, obstacles: [{ x: 46, y: 66, width: 5, height: 12, kind }] }),
      [],
      kind
    );
  }
});

test("does reject a prop kind the renderer has no drawing for", () => {
  const issues = validateJoustPrompt({
    ...validPrompt,
    obstacles: [{ x: 46, y: 66, width: 5, height: 12, kind: "cactus" }]
  });

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ["obstacles[0].kind"]
  );
  assert.match(issues[0]?.message ?? "", /lifeguard-chair/);
});

test("accepts an open lane with no obstacles", () => {
  assert.deepEqual(validateJoustPrompt({ ...validPrompt, obstacles: [] }), []);
});

test("rejects a perch reaching past either end of the lane", () => {
  const near = validateJoustPrompt({
    ...validPrompt,
    perches: [{ x: JOUST_MIN_PERCH_X - 1, y: 78, width: 60 }]
  });
  const far = validateJoustPrompt({
    ...validPrompt,
    perches: [{ x: JOUST_MAX_PERCH_X - 10, y: 78, width: 60 }]
  });

  assert.equal(near[0]?.path, "perches[0].x");
  assert.equal(far[0]?.path, "perches[0].x");
});

test("rejects a lane with no perches at all", () => {
  assert.equal(validateJoustPrompt({ ...validPrompt, perches: [] })[0]?.path, "perches");
});

test("rejects a shelf too narrow for anybody to stand on", () => {
  const issues = validateJoustPrompt({
    ...validPrompt,
    perches: [{ x: 54, y: 78, width: 102 }, { x: 116, y: 50, width: 3 }]
  });

  assert.equal(issues[0]?.path, "perches[1].width");
});

// A lane can quietly lose its standing room — a shelf hung lower than a bird is tall shades out
// the sand beneath it, a tower's legs eat the spots they stand on — until somebody has nowhere to
// go. The author should hear about it at content load, not in front of the room.
test("rejects a lane whose own structures leave too few places to stand", () => {
  const issues = validateJoustPrompt({ ...validPrompt, perches: [{ x: 54, y: 78, width: 30 }] });

  assert.equal(issues[0]?.path, "perches");
  assert.match(issues[0]?.message ?? "", /seats 3/);
});

// The floor is not a round number somebody liked: it is the worst rack a tuned night produces,
// plus headroom. A fifteen-player roster dealt into teams of three and four puts the SMALLEST team
// behind the slingshot facing the other twelve.
test("does hold the floor above the biggest rack a tuned roster can make when teams are three deep", () => {
  assert.equal(JOUST_MIN_LANE_CAPACITY, 14);
  assert.ok(JOUST_MIN_LANE_CAPACITY >= 15 - 3);
});

// This is the regression the floor exists for: every lane we ship used to seat 11, which passed a
// floor of 10 and then collapsed into the bare-ground fallback on a real roster.
test("does clear the seating floor when the lane is one we ship", () => {
  assert.ok(SHIPPED_LANES.length > 0);

  for (const lane of SHIPPED_LANES) {
    assert.ok(
      laneCapacity(lane.perches) >= JOUST_MIN_LANE_CAPACITY,
      `${lane.id} seats ${laneCapacity(lane.perches)}, under the floor of ${JOUST_MIN_LANE_CAPACITY}`
    );
    assert.deepEqual(validateJoustPrompt(lane), []);
  }
});

test("does reject a lane when it seats one player fewer than the floor", () => {
  const perches = [
    { x: 54, y: 78, width: 102 },
    { x: 112, y: 44, width: 40 }
  ];

  assert.equal(laneCapacity(perches), JOUST_MIN_LANE_CAPACITY - 1);

  const issues = validateJoustPrompt({ ...validPrompt, perches });

  assert.equal(issues[0]?.path, "perches");
  assert.match(issues[0]?.message ?? "", /at least 14/);
  assert.match(issues[0]?.message ?? "", /seats 13/);
});

test("does accept a lane when it seats exactly the floor", () => {
  const perches = [
    { x: 54, y: 78, width: 102 },
    { x: 105, y: 44, width: 49 }
  ];

  assert.equal(laneCapacity(perches), JOUST_MIN_LANE_CAPACITY);
  assert.deepEqual(validateJoustPrompt({ ...validPrompt, perches }), []);
});

test("names the obstacle that is malformed", () => {
  const issues = validateJoustPrompt({
    ...validPrompt,
    obstacles: [validPrompt.obstacles[0], { x: 10, y: 60, width: 0, height: 5 }]
  });

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ["obstacles[1].width"]
  );
});

test("keeps obstacles inside the world and above the floor", () => {
  const issues = validateJoustPrompt({
    ...validPrompt,
    obstacles: [{ x: 150, y: 70, width: 20, height: 20 }]
  });

  assert.deepEqual(
    issues.map((issue) => issue.path).sort(),
    ["obstacles[0].x", "obstacles[0].y"]
  );
});

test("requires an id and a name", () => {
  const issues = validateJoustPrompt({ perches: validPrompt.perches, obstacles: [] });

  assert.deepEqual(
    issues.map((issue) => issue.path).sort(),
    ["id", "name"]
  );
});

test("rejects a pack with duplicate lane ids", () => {
  const issues = validateJoustContentFile({ prompts: [validPrompt, validPrompt] });

  assert.equal(issues[0]?.path, "prompts[1].id");
});
