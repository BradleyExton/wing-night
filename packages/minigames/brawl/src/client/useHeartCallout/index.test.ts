import assert from "node:assert/strict";
import test from "node:test";

import { resolveHeartCalloutSeen } from "./index.js";

const block = (blockIndex: number, heartBought: boolean, status: "ready" | "running" | "done" = "ready") => ({
  blockIndex,
  heartBought,
  status
});

test("does open the callout the first time a bought block is on the street", () => {
  assert.deepEqual(resolveHeartCalloutSeen(null, block(1, true), true), { blockIndex: 1, isOpen: true });
});

test("does wait out a hold when the wall is still showing the block before", () => {
  assert.equal(resolveHeartCalloutSeen(null, block(1, true), false), null);
});

test("does say nothing when the block on the street kept the three", () => {
  assert.equal(resolveHeartCalloutSeen(null, block(1, false), true), null);
});

test("does open once a block, and not again once it has closed", () => {
  const closed = { blockIndex: 1, isOpen: false };

  assert.equal(resolveHeartCalloutSeen(closed, block(1, true, "running"), true), closed);
});

test("does forget a block when a reset unbuys it or puts the team back before it", () => {
  const closed = { blockIndex: 1, isOpen: false };

  assert.equal(resolveHeartCalloutSeen(closed, block(1, false), true), null);
  assert.equal(resolveHeartCalloutSeen(closed, block(0, false), true), null);
});
