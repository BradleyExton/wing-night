import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, createSchlonicRunStart } from "@wingnight/shared";

import { AIR_CLEARANCE, isRunnerAirborne, resolveRunnerClearance } from "./index.js";

const { groundBaseY, runnerRadius } = SCHLONIC_WORLD;
const RAIL_Y = groundBaseY - 12;
const FLAT: SchlonicZone = {
  heights: Array.from({ length: 60 }, () => groundBaseY),
  pits: [],
  props: [{ index: 0, kind: "rail", x: 200, toX: 248, y: RAIL_Y }],
  goalX: 560
};
const START = { ...createSchlonicRunStart(FLAT), x: 120 };
const feetAt = (feetY: number): number => feetY - runnerRadius;

test("does report no clearance when the feet are down", () => {
  assert.equal(resolveRunnerClearance(FLAT, START), 0);
  assert.equal(isRunnerAirborne(FLAT, START), false);
});

test("does measure to the street when the runner is over open paving", () => {
  const up = { ...START, grounded: false, y: feetAt(groundBaseY - 7) };

  assert.equal(resolveRunnerClearance(FLAT, up), 7);
  assert.equal(isRunnerAirborne(FLAT, up), true);
  assert.equal(isRunnerAirborne(FLAT, { ...up, y: feetAt(groundBaseY - AIR_CLEARANCE + 1) }), false);
});

test("does measure to the rail's top when the runner is over a rail, and to the street when under it", () => {
  const over = { ...START, x: 220, grounded: false, y: feetAt(RAIL_Y - 2) };
  const under = { ...START, x: 220, grounded: false, y: feetAt(groundBaseY - 5) };

  assert.equal(resolveRunnerClearance(FLAT, over), 2);
  assert.equal(isRunnerAirborne(FLAT, over), false);
  assert.equal(resolveRunnerClearance(FLAT, under), 5);
});
