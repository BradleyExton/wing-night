import assert from "node:assert/strict";
import test from "node:test";
import { BRAWL_WORLD, type BrawlGoon, type BrawlGoonKind } from "@wingnight/shared";

import {
  DEPTH_NEAR,
  DEPTH_RAMP,
  resolveDepthOrder,
  resolveDepthShare,
  resolveGoonDepth,
  resolveGoonLane
} from "./index.js";

const KINDS: BrawlGoonKind[] = ["goose", "gull", "raccoon", "swan", "helmet", "boss"];

const goon = (overrides: Partial<BrawlGoon> = {}): Pick<BrawlGoon, "spawnIndex" | "kind" | "x" | "state"> => ({
  spawnIndex: 0,
  kind: "goose",
  x: 150,
  state: "approach",
  ...overrides
});

test("does deal every spawn one of three depth lines, the same on every screen", () => {
  const lanes = Array.from({ length: 9 }, (_unused, index) => resolveGoonLane(index));

  assert.deepEqual(new Set(lanes), new Set([-1, 0, 1]));
  // Three spawns in a row never share a line.
  assert.equal(new Set(lanes.slice(0, 3)).size, 3);
  assert.deepEqual(lanes, Array.from({ length: 9 }, (_unused, index) => resolveGoonLane(index)));
});

test("does keep every goon on the hen's line when it is within its reach and the near margin", () => {
  for (const kind of KINDS) {
    const { reach } = BRAWL_WORLD.goons[kind];

    for (let distance = 0; distance <= reach + DEPTH_NEAR; distance += 0.25) {
      assert.equal(resolveDepthShare(distance, reach), 0, `${kind} at ${distance}`);

      for (const spawnIndex of [0, 1, 2]) {
        for (const side of [-1, 1]) {
          const depth = resolveGoonDepth(goon({ kind, spawnIndex, x: 60 + side * distance }), 60, undefined);

          assert.equal(Math.abs(depth), 0, `${kind} #${spawnIndex} at ${side * distance}`);
        }
      }
    }
  }
});

test("does step a far goon all the way onto its own line and ramp it in as it closes", () => {
  const { reach } = BRAWL_WORLD.goons.goose;

  assert.equal(resolveDepthShare(reach + DEPTH_NEAR + DEPTH_RAMP, reach), 1);
  assert.equal(resolveDepthShare(500, reach), 1);
  assert.equal(resolveDepthShare(reach + DEPTH_NEAR + DEPTH_RAMP / 2, reach), 0.5);
  // Spawn 0 mills behind her line, spawn 2 in front of it, spawn 1 on it.
  assert.equal(resolveGoonDepth(goon({ spawnIndex: 0, x: 150 }), 30, undefined), -1);
  assert.equal(resolveGoonDepth(goon({ spawnIndex: 2, x: 150 }), 30, undefined), 1);
  assert.equal(resolveGoonDepth(goon({ spawnIndex: 1, x: 150 }), 30, undefined), 0);
});

test("does keep a gull off the depth lines, because it is in the air", () => {
  assert.equal(resolveGoonDepth(goon({ kind: "gull", spawnIndex: 0, x: 150 }), 30, undefined), 0);
});

test("does hold the depth a goon was hit at while it reels and falls", () => {
  for (const state of ["stunned", "ko", "gone"] as const) {
    assert.equal(resolveGoonDepth(goon({ state, spawnIndex: 0, x: 150 }), 30, -0.25), -0.25);
  }

  // Back on its feet, it walks its line again.
  assert.equal(resolveGoonDepth(goon({ state: "approach", spawnIndex: 0, x: 150 }), 30, -0.25), -1);
});

test("does draw the far line first and keep spawn order among goons on one line", () => {
  const order = resolveDepthOrder(
    new Map([
      [0, 0],
      [1, 1],
      [2, -0.5],
      [3, 0]
    ])
  );

  assert.deepEqual(order, [2, 0, 3, 1]);
});

test("does stand a stalking swan on the hen's line whatever its lane", () => {
  for (const spawnIndex of [0, 1, 2]) {
    assert.equal(resolveGoonDepth(goon({ kind: "swan", spawnIndex, state: "stalk", x: 150 }), 150 - BRAWL_WORLD.goons.swan.reach, undefined), 0);
    // Even one that drifted a little past its reach before it re-checked.
    assert.equal(resolveGoonDepth(goon({ kind: "swan", spawnIndex, state: "stalk", x: 150 }), 60, undefined), 0);
  }
});
