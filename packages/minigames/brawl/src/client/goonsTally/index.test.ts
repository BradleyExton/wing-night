import assert from "node:assert/strict";
import test from "node:test";

import { formatGoonsTally, paintGoonsTally, resolveGoonsBanked } from "./index.js";

test("does write the worth down over the course's worth", () => {
  assert.equal(formatGoonsTally(4, 27), "4 / 27");
});

test("does rewrite the text node React rendered rather than replace it when the tally moves", () => {
  const node = { nodeType: 3, nodeValue: "0 / 27", nextSibling: null };
  const element = { firstChild: node, textContent: "0 / 27" };

  paintGoonsTally(element as unknown as HTMLElement, 5, 27);

  assert.equal(node.nodeValue, "5 / 27");
  assert.equal(element.firstChild, node);
});

test("does nothing when there is no element to write into", () => {
  assert.doesNotThrow(() => {
    paintGoonsTally(null, 1, 2);
  });
});

test("does bank only the blocks before this one when the turn is part-way through", () => {
  const blocks = [
    { blockIndex: 0, result: { goons: 5 } },
    { blockIndex: 1, result: { goons: 3 } },
    { blockIndex: 2, result: null }
  ];

  assert.equal(resolveGoonsBanked(blocks, 0), 0);
  assert.equal(resolveGoonsBanked(blocks, 2), 8);
});
