import assert from "node:assert/strict";
import test from "node:test";

import { JOUST_PERCH_THICKNESS } from "@wingnight/shared";

import { plankPath } from "./index.js";

test("does close a four-corner slab starting at the near end", () => {
  const path = plankPath({ x: 10, y: 50 }, { x: 30, y: 50 });

  assert.equal(path.startsWith("M10 50 L30 50 "), true);
  assert.equal(path.endsWith(" Z"), true);
});

test("does lay the slab's thickness above a level span, not below it", () => {
  const corners = plankPath({ x: 10, y: 50 }, { x: 30, y: 50 }).match(/L([\d.-]+) ([\d.-]+)/g) ?? [];
  const farTop = corners[1] ?? "";

  assert.equal(farTop, `L30 ${50 - JOUST_PERCH_THICKNESS}`);
});

test("does keep the slab a slab when the two ends are on top of each other", () => {
  // A folded tower can put both leg tops at the same point; a zero-length span must not
  // divide by zero and paint NaN into the lane.
  assert.doesNotMatch(plankPath({ x: 12, y: 40 }, { x: 12, y: 40 }), /NaN/);
});
