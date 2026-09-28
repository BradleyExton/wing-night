import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { resolveMirrorEvents } from "./index.js";

const zone: SchlonicZone = {
  heights: [],
  pits: [],
  props: [
    { index: 0, kind: "wing", x: 10, y: 5 },
    { index: 1, kind: "badnik", x: 20, y: 8 },
    { index: 2, kind: "spring", x: 30, y: 8 },
    { index: 3, kind: "spike", x: 40, y: 8 }
  ],
  goalX: 100
};

const frame = (overrides: Partial<SchlonicFrame> = {}): SchlonicFrame => ({
  tick: 0,
  x: 0,
  y: 0,
  vx: 1,
  vy: 0,
  grounded: true,
  holding: false,
  wings: 0,
  takenProps: [],
  hits: [],
  invulnerableUntilTick: 0,
  outcome: null,
  ...overrides
});

test("does announce a jump when the runner leaves the ground under its own legs", () => {
  const previous = frame();
  const next = frame({ tick: 1, grounded: false, vy: SCHLONIC_WORLD.jumpVelocity });

  assert.deepEqual(resolveMirrorEvents(previous, next, zone), ["jumped"]);
});

test("does announce the spring instead of a jump when a springboard throws the runner", () => {
  const previous = frame({ grounded: false, vy: 0.4 });
  const next = frame({ tick: 1, grounded: false, vy: SCHLONIC_WORLD.springVelocity });

  assert.deepEqual(resolveMirrorEvents(previous, next, zone), ["sprung"]);
});

test("does announce a landing when the runner is back on its feet", () => {
  const previous = frame({ grounded: false, vy: 1 });
  const next = frame({ tick: 1, grounded: true });

  assert.deepEqual(resolveMirrorEvents(previous, next, zone), ["landed"]);
});

test("does tell a wing from a badnik by the zone's own prop kinds", () => {
  const previous = frame();
  const next = frame({ tick: 1, takenProps: [0, 1], wings: 4 });

  assert.deepEqual(resolveMirrorEvents(previous, next, zone), ["wingTaken", "badnikPopped"]);
});

test("does announce a hit once per new entry in the hit log", () => {
  const previous = frame({ hits: [3] });
  const next = frame({ tick: 1, hits: [3, 9] });

  assert.deepEqual(resolveMirrorEvents(previous, next, zone), ["hit"]);
});

test("does announce each ending once, on the frame it lands", () => {
  assert.deepEqual(resolveMirrorEvents(frame(), frame({ tick: 1, outcome: "cleared" }), zone), ["cleared"]);
  assert.deepEqual(resolveMirrorEvents(frame(), frame({ tick: 1, outcome: "wiped" }), zone), ["wiped"]);
  assert.deepEqual(
    resolveMirrorEvents(frame(), frame({ tick: 1, grounded: false, outcome: "fell" }), zone),
    ["fell"]
  );
  assert.deepEqual(
    resolveMirrorEvents(frame({ outcome: "fell" }), frame({ tick: 1, outcome: "fell" }), zone),
    []
  );
});

test("does say nothing when the mirror has not moved forward", () => {
  const settled = frame({ tick: 5, takenProps: [0] });

  assert.deepEqual(resolveMirrorEvents(settled, frame({ tick: 5, takenProps: [0, 1] }), zone), []);
});
