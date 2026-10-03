import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlMinigameBlock } from "@wingnight/shared";

import { resolveHeartOffer } from "./index.js";

const block = (blockIndex: number, overrides: Partial<BrawlMinigameBlock> = {}): BrawlMinigameBlock => ({
  blockIndex,
  player: null,
  status: "ready",
  inputs: [],
  skipped: false,
  result: null,
  heartBought: false,
  ...overrides
});

const onBlockOne = (overrides: Partial<{ goonsDown: number; blocks: BrawlMinigameBlock[] }> = {}) => ({
  blockIndex: 1,
  blocks: [block(0, { status: "done", result: { outcome: "cleared", endTick: 900, goons: 11, hearts: 3 } }), block(1)],
  goonsDown: 14,
  heartPrice: 3,
  ...overrides
});

test("does put the cards up on a ready block after the first when the team can pay", () => {
  assert.deepEqual(resolveHeartOffer({ view: onBlockOne(), blockIndex: 1, isArmed: true, closedBlockIndex: null }), {
    heartPrice: 3,
    banked: 14
  });
});

test("does keep the cards down when the holder closed them by keeping the three or touching the street", () => {
  assert.equal(resolveHeartOffer({ view: onBlockOne(), blockIndex: 1, isArmed: true, closedBlockIndex: 1 }), null);
  // A pick closed on another block does not close this one.
  assert.notEqual(resolveHeartOffer({ view: onBlockOne(), blockIndex: 1, isArmed: true, closedBlockIndex: 0 }), null);
});

test("does keep the cards down when the offer does not stand", () => {
  const first = { ...onBlockOne(), blockIndex: 0, blocks: [block(0), block(1)] };

  // The first block: nothing to spend, no handoff before it.
  assert.equal(resolveHeartOffer({ view: first, blockIndex: 0, isArmed: true, closedBlockIndex: null }), null);
  // Too poor.
  assert.equal(resolveHeartOffer({ view: onBlockOne({ goonsDown: 2 }), blockIndex: 1, isArmed: true, closedBlockIndex: null }), null);
  // Already bought, or already started.
  for (const overrides of [{ heartBought: true }, { status: "running" as const }]) {
    const view = onBlockOne({ blocks: [block(0), block(1, overrides)] });

    assert.equal(resolveHeartOffer({ view, blockIndex: 1, isArmed: true, closedBlockIndex: null }), null);
  }
  // Through the handoff beat (the street still shows block 0), or a tablet that may not act.
  assert.equal(resolveHeartOffer({ view: onBlockOne(), blockIndex: 0, isArmed: true, closedBlockIndex: null }), null);
  assert.equal(resolveHeartOffer({ view: onBlockOne(), blockIndex: 1, isArmed: false, closedBlockIndex: null }), null);
});
