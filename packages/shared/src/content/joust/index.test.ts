import assert from "node:assert/strict";
import test from "node:test";

import {
  JOUST_MAX_TARGET_X,
  JOUST_MIN_TARGET_X,
  isJoustContentFile,
  validateJoustContentFile,
  validateJoustPrompt
} from "./index.js";

const validPrompt = {
  id: "arena-1",
  name: "Lone Saguaro",
  targetX: 126,
  obstacles: [{ x: 78, y: 54, width: 6, height: 24 }]
};

test("accepts an arena with a champ in range and well-formed cacti", () => {
  assert.deepEqual(validateJoustPrompt(validPrompt), []);
  assert.equal(isJoustContentFile({ prompts: [validPrompt] }), true);
});

test("accepts an open arena with no obstacles", () => {
  assert.deepEqual(validateJoustPrompt({ ...validPrompt, obstacles: [] }), []);
});

test("rejects a champ standing too close or off the edge", () => {
  const near = validateJoustPrompt({ ...validPrompt, targetX: JOUST_MIN_TARGET_X - 1 });
  const far = validateJoustPrompt({ ...validPrompt, targetX: JOUST_MAX_TARGET_X + 1 });

  assert.equal(near[0]?.path, "targetX");
  assert.equal(far[0]?.path, "targetX");
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
  const issues = validateJoustPrompt({ targetX: 120, obstacles: [] });

  assert.deepEqual(
    issues.map((issue) => issue.path).sort(),
    ["id", "name"]
  );
});

test("rejects a pack with duplicate arena ids", () => {
  const issues = validateJoustContentFile({ prompts: [validPrompt, validPrompt] });

  assert.equal(issues[0]?.path, "prompts[1].id");
});
