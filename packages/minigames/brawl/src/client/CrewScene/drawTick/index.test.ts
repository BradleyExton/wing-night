import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlCrewGoon } from "@wingnight/shared";

import { CLANK_TICKS } from "../Goons/index.js";
import {
  resolveClankAge,
  resolveGoonBodyTransform,
  resolveGoonDrawTick,
  resolveGoonSlotTransform,
  resolveGoonsSignature
} from "./index.js";

const goon = (overrides: Partial<BrawlCrewGoon> = {}): BrawlCrewGoon => ({
  spawnIndex: 2,
  kind: "goose",
  x: 80,
  z: 12,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 1,
  state: "approach",
  stateUntilTick: 0,
  koTick: null,
  target: 0,
  ...overrides
});

test("does hold a walking goon's drawing to its walk frame and a lunging one still", () => {
  assert.equal(resolveGoonDrawTick("approach", 13), 8);
  assert.equal(resolveGoonDrawTick("approach", 15), 8);
  assert.equal(resolveGoonDrawTick("telegraph", 13), 12);
  assert.equal(resolveGoonDrawTick("attack", 13), 0);
});

test("does keep the signature when only a goon's place on the street moved between frames", () => {
  const before = resolveGoonsSignature({ tick: 9, goons: [goon()], events: [] });
  const after = resolveGoonsSignature({ tick: 10, goons: [goon({ x: 79.5, z: 13 })], events: [] });

  assert.equal(before, after);
});

test("does change the signature when a goon changes state, arrives or leaves", () => {
  const base = resolveGoonsSignature({ tick: 9, goons: [goon()], events: [] });

  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon({ state: "telegraph" })], events: [] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [goon(), goon({ spawnIndex: 3 })], events: [] }), base);
  assert.notEqual(resolveGoonsSignature({ tick: 9, goons: [], events: [] }), base);
});

test("does read a clank off the frame's events while it is fresh, for the goon it bounced off", () => {
  const events = [
    { tick: 100, kind: "clank" as const, hen: 0, spawnIndex: 2 },
    { tick: 100, kind: "landed" as const, hen: 0, spawnIndex: 2 }
  ];

  assert.equal(resolveClankAge({ tick: 100, events }, 2), 0);
  assert.equal(resolveClankAge({ tick: 103, events }, 2), 2);
  assert.equal(resolveClankAge({ tick: 100 + CLANK_TICKS, events }, 2), null);
  assert.equal(resolveClankAge({ tick: 101, events }, 5), null);
  assert.notEqual(
    resolveGoonsSignature({ tick: 101, goons: [goon({ kind: "helmet" })], events }),
    resolveGoonsSignature({ tick: 101, goons: [goon({ kind: "helmet" })], events: [] })
  );
});

test("does stand a goon's slot on its line and lift only its body off it", () => {
  assert.equal(resolveGoonSlotTransform(goon({ x: 80.126, z: 12 })), "translate(80.13 12)");
  assert.equal(resolveGoonBodyTransform(goon({ y: 0, facing: -1 })), "translate(0 0) scale(-1 1)");
  assert.equal(resolveGoonBodyTransform(goon({ y: 30, facing: 1 })), "translate(0 -30) scale(1 1)");
});
