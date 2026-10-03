import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_WORLD } from "@wingnight/shared";

import {
  HEART_CARRY_FROM,
  HEART_CARRY_TO,
  formatGoonsTally,
  paintGoonsTally,
  resolveGoonsBanked,
  resolveHeartsCarried,
  resolveHeartsWorth
} from "./index.js";

test("does write the worth banked over the course's worth", () => {
  assert.equal(formatGoonsTally(4, 57), "4 / 57");
});

test("does rewrite the text node React rendered rather than replace it when the tally moves", () => {
  const node = { nodeType: 3, nodeValue: "0 / 57", nextSibling: null };
  const element = { firstChild: node, textContent: "0 / 57" };

  paintGoonsTally(element as unknown as HTMLElement, 5, 57);

  assert.equal(node.nodeValue, "5 / 57");
  assert.equal(element.firstChild, node);
});

test("does nothing when there is no element to write into", () => {
  assert.doesNotThrow(() => {
    paintGoonsTally(null, 1, 2);
  });
});

test("does bank only the blocks before this one when the turn is part-way through", () => {
  const blocks = [
    { blockIndex: 0, result: { outcome: "ko" as const, goons: 5, hearts: 0 }, heartBought: false },
    { blockIndex: 1, result: { outcome: "timeout" as const, goons: 3, hearts: 2 }, heartBought: false },
    { blockIndex: 2, result: null, heartBought: false }
  ];

  assert.equal(resolveGoonsBanked(blocks, 0, 3), 0);
  assert.equal(resolveGoonsBanked(blocks, 2, 3), 8);
});

test("does count up from the bank after the heart's price when the block in hand was bought", () => {
  const blocks = [
    { blockIndex: 0, result: { outcome: "cleared" as const, goons: 11, hearts: 2 }, heartBought: false },
    { blockIndex: 1, result: null, heartBought: true },
    { blockIndex: 2, result: null, heartBought: false }
  ];

  // Block 0's 13, less the 3 the heart on block 1 cost — the view's own `goonsDown`.
  assert.equal(resolveGoonsBanked(blocks, 0, 3), 0);
  assert.equal(resolveGoonsBanked(blocks, 1, 3), 13 - 3);
  assert.equal(resolveGoonsBanked(blocks, 2, 3), 13 - 3);
});

test("does add nothing for a bought fourth heart when the hearts fly into the tally", () => {
  assert.equal(resolveHeartsWorth(4), 3 * BRAWL_WORLD.heartWorth);
  assert.equal(resolveHeartsWorth(2), 2 * BRAWL_WORLD.heartWorth);
});

test("does bank the hearts she walked off with when the block before was cleared", () => {
  const blocks = [
    { blockIndex: 0, result: { outcome: "cleared" as const, goons: 11, hearts: 2 }, heartBought: false },
    { blockIndex: 1, result: null, heartBought: false }
  ];

  assert.equal(resolveGoonsBanked(blocks, 1, 3), 11 + 2 * BRAWL_WORLD.heartWorth);
});

test("does fly the hearts into the tally one at a time across the middle of the handoff beat", () => {
  assert.equal(resolveHeartsCarried(3, 0), 0);
  assert.equal(resolveHeartsCarried(3, HEART_CARRY_FROM - 0.01), 0);
  assert.equal(resolveHeartsCarried(3, HEART_CARRY_FROM), 1);
  assert.equal(resolveHeartsCarried(3, (HEART_CARRY_FROM + HEART_CARRY_TO) / 2), 2);
  assert.equal(resolveHeartsCarried(3, HEART_CARRY_TO), 3);
  assert.equal(resolveHeartsCarried(3, 1), 3);
  // She walked off with one: it goes at the start and that is all of them.
  assert.equal(resolveHeartsCarried(1, HEART_CARRY_FROM), 1);
  assert.equal(resolveHeartsCarried(1, 1), 1);
  // Nothing to carry.
  assert.equal(resolveHeartsCarried(0, 1), 0);
});

test("does price the carried hearts at the world's heart worth", () => {
  assert.equal(resolveHeartsWorth(2), 2 * BRAWL_WORLD.heartWorth);
  assert.equal(resolveHeartsWorth(0), 0);
});
