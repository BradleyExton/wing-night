import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_WORLD, createBrawlRunStart, resolveBrawlBlock, runBrawlRun } from "@wingnight/shared";

import { resolveViewBlock, resolveViewCourse } from "./index.js";

const VIEW = { courseSeed: 20261001, blocksPerTurn: 2 };

test("does start the tablet's runner and the TV's mirror on three hearts when the block kept them", () => {
  const block = resolveViewBlock(VIEW, 1, false);

  assert.equal(block.hearts, BRAWL_WORLD.heartsMax);
  assert.equal(createBrawlRunStart(block).hearts, 3);
});

test("does start the tablet's runner and the TV's mirror on four hearts when the view says one was bought", () => {
  const block = resolveViewBlock(VIEW, 1, true);
  const course = resolveViewCourse(VIEW, 1, true);

  assert.equal(createBrawlRunStart(block).hearts, 4);
  // The course a wall re-runs a missed block from is the referee's own: same block, same hearts.
  assert.deepEqual(resolveBrawlBlock(course), block);
  assert.equal(runBrawlRun(course, []).frame.hits.length, 4);
});
