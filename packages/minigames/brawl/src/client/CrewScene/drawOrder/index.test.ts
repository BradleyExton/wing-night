import assert from "node:assert/strict";
import test from "node:test";

import { DRAW_ORDER_SLACK, resolveDrawOrder } from "./index.js";

const depths = (entries: Record<string, number>): Map<string, number> => new Map(Object.entries(entries));

test("does draw the back of the band first and the figure nearest the camera last", () => {
  assert.deepEqual(resolveDrawOrder([], depths({ h0: 20, g1: 4, h1: 30, g2: 12 })), ["g1", "g2", "h0", "h1"]);
});

test("does keep two figures on one line in the order they were in, so they never flicker past each other", () => {
  const before = ["h0", "g3"];

  assert.deepEqual(resolveDrawOrder(before, depths({ h0: 16.4, g3: 16 })), before);
  assert.deepEqual(resolveDrawOrder(before, depths({ h0: 16 + DRAW_ORDER_SLACK, g3: 16 })), before);
});

test("does swap two figures once one is clearly nearer the camera than the one it was behind", () => {
  assert.deepEqual(resolveDrawOrder(["h0", "g3"], depths({ h0: 16 + DRAW_ORDER_SLACK + 0.1, g3: 16 })), ["g3", "h0"]);
});

test("does drop a figure that left the street and stand a new one where its depth puts it", () => {
  assert.deepEqual(resolveDrawOrder(["g1", "h0", "g2"], depths({ h0: 10, g2: 24, g9: 2 })), ["g9", "h0", "g2"]);
});
