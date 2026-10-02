import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlGoon } from "@wingnight/shared";

import { resolveClankAge, resolveGoonDrawTick, resolveGoonTransform, resolveGoonsSignature } from "./index.js";

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
  const before = resolveGoonsSignature({ tick: 9, goons: [goon()], clanks: [] });
  const after = resolveGoonsSignature({ tick: 10, goons: [goon({ x: 79.5 })], clanks: [] });

  assert.equal(before, after);
});

test("does change the signature when a goon changes state, arrives or leaves", () => {
  const base = resolveGoonsSignature({ tick: 9, goons: [goon()], clanks: [] });

  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon({ state: "telegraph" })], clanks: [] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon(), goon({ spawnIndex: 3 })], clanks: [] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [], clanks: [] }), base);
});

test("does lift a goon by its height and flip it to its facing", () => {
  assert.equal(resolveGoonTransform({ x: 80.123, y: 12, facing: -1 }), "translate(80.12 -12) scale(-1 1)");
});

test("does stand a goon on its depth line about its foot when it is off the hen's line", () => {
  // A whole line in front: 5 down the screen, drawn 6% bigger, the foot still on that line.
  assert.equal(resolveGoonTransform({ x: 80, y: 0, facing: 1 }, 1), "translate(80 0.8) scale(1.06 1.06)");
  // A whole line behind, facing left: up the screen and smaller.
  assert.equal(resolveGoonTransform({ x: 80, y: 0, facing: -1 }, -1), "translate(80 -0.8) scale(-0.94 0.94)");
});

test("does hold a stalking swan's drawing still", () => {
  assert.equal(resolveGoonDrawTick("stalk", 13), 0);
  assert.equal(resolveGoonDrawTick("stalk", 99), 0);
});

test("does age a clank in steps while it bursts, and forget it once it is spent", () => {
  const clanks = [{ tick: 40, spawnIndex: 2 }];

  assert.equal(resolveClankAge({ tick: 40, clanks }, 2), 0);
  assert.equal(resolveClankAge({ tick: 43, clanks }, 2), 2);
  assert.equal(resolveClankAge({ tick: 51, clanks }, 2), 10);
  assert.equal(resolveClankAge({ tick: 52, clanks }, 2), null);
  assert.equal(resolveClankAge({ tick: 43, clanks }, 3), null, "another goon's clank");
  assert.equal(resolveClankAge({ tick: 30, clanks: [] }, 2), null);
});

test("does change the signature while a clank bursts off a goon and settle once it is spent", () => {
  const frame = (tick: number) => ({ tick, goons: [goon({ state: "stunned" })], clanks: [{ tick: 42, spawnIndex: 2 }] });

  assert.notEqual(resolveGoonsSignature(frame(42)), resolveGoonsSignature({ ...frame(42), clanks: [] }));
  assert.notEqual(resolveGoonsSignature(frame(42)), resolveGoonsSignature(frame(44)));
  assert.equal(resolveGoonsSignature(frame(60)), resolveGoonsSignature({ ...frame(60), clanks: [] }));
});
