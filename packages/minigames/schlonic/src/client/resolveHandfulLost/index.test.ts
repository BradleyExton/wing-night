import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, advanceSchlonic, createSchlonicRunStart } from "@wingnight/shared";

import { resolveHandfulLost } from "./index.js";

const FLAT = SCHLONIC_WORLD.groundBaseY;
const STAND_Y = FLAT - SCHLONIC_WORLD.runnerRadius;

// A flat street with two wings on the floor, then a hole a walker cannot get over.
const ZONE: SchlonicZone = {
  heights: Array.from({ length: 80 }, () => FLAT),
  pits: [{ fromX: 200, toX: 200 + SCHLONIC_WORLD.pitWidth, lipY: FLAT }],
  props: [
    { index: 0, kind: "wing", x: 80, y: STAND_Y },
    { index: 1, kind: "wing", x: 90, y: STAND_Y }
  ],
  goalX: 700
};

test("does read the handful off the tick before the hole took it", () => {
  const frame = advanceSchlonic(createSchlonicRunStart(ZONE), ZONE, [], 900);

  assert.equal(frame.outcome, "fell");
  assert.equal(frame.wings, 0);
  assert.equal(resolveHandfulLost(ZONE, [], frame), 2);
});

test("does lose nothing it was holding when the run did not end in a hole", () => {
  const start = createSchlonicRunStart(ZONE);

  assert.equal(resolveHandfulLost(ZONE, [], { ...start, tick: 40, wings: 0, outcome: "wiped" }), 0);
  assert.equal(resolveHandfulLost(ZONE, [], { ...start, tick: 40, wings: 9, outcome: "cleared" }), 0);
});
