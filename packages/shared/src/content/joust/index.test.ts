import assert from "node:assert/strict";
import test from "node:test";

import {
  JOUST_MAX_PERCH_X,
  JOUST_MIN_PERCH_X,
  isJoustContentFile,
  validateJoustContentFile,
  validateJoustPrompt
} from "./index.js";

const validPrompt = {
  id: "arena-1",
  name: "The Lookout",
  perches: [
    { x: 54, y: 78, width: 102 },
    { x: 116, y: 50, width: 34 }
  ],
  obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
};

test("accepts a lane with perches in range and well-formed cacti", () => {
  assert.deepEqual(validateJoustPrompt(validPrompt), []);
  assert.equal(isJoustContentFile({ prompts: [validPrompt] }), true);
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
