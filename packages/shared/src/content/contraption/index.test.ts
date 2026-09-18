import assert from "node:assert/strict";
import test from "node:test";

import {
  isContraptionContentFile,
  validateContraptionContentFile,
  validateContraptionLevel,
  validateContraptionPieces
} from "./index.js";

const level = (id: string): Record<string, unknown> => ({
  id,
  title: `Level ${id}`,
  wing: { x: 10, y: 12, velocity: { x: 40, y: -20 } },
  bucket: { x: 60, width: 18, height: 14 },
  pieceBudget: 3,
  pointsLanded: 5,
  solution: [{ kind: "slope-right", column: 4, row: 5 }]
});

const pathsOf = (issues: { path: string }[]): string[] => {
  return issues.map((issue) => issue.path);
};

test("returns no issues when every level is complete and uniquely keyed", () => {
  const content = { prompts: [level("l1"), level("l2")] };

  assert.deepEqual(validateContraptionContentFile(content), []);
  assert.equal(isContraptionContentFile(content), true);
});

test("accepts optional obstacles and pickups", () => {
  const content = {
    prompts: [
      {
        ...level("l1"),
        obstacles: [{ id: "ledge", from: { x: 20, y: 40 }, to: { x: 40, y: 40 } }],
        pickups: [{ id: "bonus", x: 50, y: 50, points: 2 }]
      }
    ]
  };

  assert.deepEqual(validateContraptionContentFile(content), []);
});

test("reports the prompts path when the pack has no levels", () => {
  assert.deepEqual(pathsOf(validateContraptionContentFile({ prompts: [] })), [
    "prompts"
  ]);
});

test("reports a duplicate level id on its second occurrence", () => {
  const content = { prompts: [level("l1"), level("l1")] };

  assert.deepEqual(pathsOf(validateContraptionContentFile(content)), [
    "prompts[1].id"
  ]);
});

test("rejects a wing that starts outside the field", () => {
  assert.deepEqual(
    pathsOf(validateContraptionLevel({ ...level("l1"), wing: { x: 120, y: 5, velocity: { x: 0, y: 0 } } })),
    ["wing.x"]
  );
});

test("rejects a throw velocity that is not numeric", () => {
  assert.deepEqual(
    pathsOf(
      validateContraptionLevel({ ...level("l1"), wing: { x: 10, y: 5, velocity: { x: "fast", y: 0 } } })
    ),
    ["wing.velocity.x"]
  );
});

test("rejects a bucket that overhangs the field edge", () => {
  assert.deepEqual(
    pathsOf(validateContraptionLevel({ ...level("l1"), bucket: { x: 90, width: 20, height: 14 } })),
    ["bucket.width"]
  );
});

test("rejects a solution that spends more than the piece budget", () => {
  const solution = [
    { kind: "shelf", column: 0, row: 0 },
    { kind: "shelf", column: 1, row: 0 }
  ];

  assert.deepEqual(
    pathsOf(validateContraptionLevel({ ...level("l1"), pieceBudget: 1, solution })),
    ["solution"]
  );
});

test("rejects a piece of unknown kind or off the grid", () => {
  assert.deepEqual(
    pathsOf(
      validateContraptionPieces([
        { kind: "trampoline", column: 2, row: 2 },
        { kind: "shelf", column: 10, row: -1 }
      ])
    ),
    ["[0].kind", "[1].column", "[1].row"]
  );
});

test("rejects two pieces in the same cell on the second occurrence", () => {
  assert.deepEqual(
    pathsOf(
      validateContraptionPieces([
        { kind: "shelf", column: 2, row: 2 },
        { kind: "steep-left", column: 2, row: 2 }
      ])
    ),
    ["[1]"]
  );
});

test("reports a duplicate pickup id within a level", () => {
  const pickups = [
    { id: "bonus", x: 50, y: 50, points: 2 },
    { id: "bonus", x: 60, y: 50, points: 2 }
  ];

  assert.deepEqual(
    pathsOf(validateContraptionLevel({ ...level("l1"), pickups })),
    ["pickups[1].id"]
  );
});

test("reports each missing scoring field separately", () => {
  assert.deepEqual(
    pathsOf(validateContraptionLevel({ ...level("l1"), pieceBudget: 0, pointsLanded: -1 })),
    ["pieceBudget", "pointsLanded"]
  );
});

test("reports the entry itself when a level is not an object", () => {
  assert.deepEqual(pathsOf(validateContraptionContentFile({ prompts: [42] })), [
    "prompts[0]"
  ]);
});
