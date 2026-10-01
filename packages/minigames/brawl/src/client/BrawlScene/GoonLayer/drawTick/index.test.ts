import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlGoon } from "@wingnight/shared";

import { resolveGoonDrawTick, resolveGoonTransform, resolveGoonsSignature } from "./index.js";

const goon = (overrides: Partial<BrawlGoon> = {}): BrawlGoon => ({
  spawnIndex: 2,
  kind: "goose",
  x: 80,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 1,
  state: "approach",
  stateUntilTick: 0,
  koTick: null,
  ...overrides
});

test("does hold a walking goon's drawing to its walk frame and a lunging one still", () => {
  assert.equal(resolveGoonDrawTick("approach", 13), 8);
  assert.equal(resolveGoonDrawTick("approach", 15), 8);
  assert.equal(resolveGoonDrawTick("telegraph", 13), 12);
  assert.equal(resolveGoonDrawTick("attack", 13), 0);
});

test("does keep the signature when only a goon's position moved between frames", () => {
  const before = resolveGoonsSignature({ tick: 9, goons: [goon()] });
  const after = resolveGoonsSignature({ tick: 10, goons: [goon({ x: 79.5 })] });

  assert.equal(before, after);
});

test("does change the signature when a goon changes state, arrives or leaves", () => {
  const base = resolveGoonsSignature({ tick: 9, goons: [goon()] });

  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon({ state: "telegraph" })] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon(), goon({ spawnIndex: 3 })] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [] }), base);
});

test("does lift a goon by its height and flip it to its facing", () => {
  assert.equal(resolveGoonTransform({ x: 80.123, y: 12, facing: -1 }), "translate(80.12 -12) scale(-1 1)");
});
