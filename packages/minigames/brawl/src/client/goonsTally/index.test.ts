import assert from "node:assert/strict";
import test from "node:test";

import { formatGoonsTally, paintGoonsTally } from "./index.js";

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
