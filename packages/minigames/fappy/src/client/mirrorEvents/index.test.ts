import assert from "node:assert/strict";
import test from "node:test";
import type { FappyFrame } from "@wingnight/shared";

import { resolveMirrorEvents } from "./index.js";

const frame = (overrides: Partial<FappyFrame> = {}): FappyFrame => ({
  tick: 0,
  bird: { y: 100, vy: 0 },
  scrollX: 0,
  gatesCleared: 0,
  knockedEagles: [],
  splats: [],
  outcome: null,
  ...overrides
});

test("does say nothing when the mirror redraws the same tick", () => {
  assert.deepEqual(resolveMirrorEvents(frame({ tick: 12 }), frame({ tick: 12 }), [12]), []);
});

test("does report a flap when the step spends a logged tick", () => {
  assert.deepEqual(resolveMirrorEvents(frame({ tick: 12 }), frame({ tick: 13 }), [12]), ["flap"]);
});

test("does report one flap when a late log makes the step spend several", () => {
  assert.deepEqual(resolveMirrorEvents(frame({ tick: 10 }), frame({ tick: 16 }), [10, 12, 15]), [
    "flap"
  ]);
});

test("does stay quiet when the only logged flap is still ahead of the step", () => {
  assert.deepEqual(resolveMirrorEvents(frame({ tick: 10 }), frame({ tick: 12 }), [12]), []);
});

test("does report one tick per gate when the bird clears more than one", () => {
  assert.deepEqual(
    resolveMirrorEvents(frame({ tick: 4, gatesCleared: 1 }), frame({ tick: 6, gatesCleared: 3 }), []),
    ["gateCleared", "gateCleared"]
  );
});

test("does report a bump when an eagle leaves the sky", () => {
  assert.deepEqual(
    resolveMirrorEvents(
      frame({ tick: 4 }),
      frame({ tick: 5, knockedEagles: [{ gate: 2, tick: 5 }] }),
      []
    ),
    ["eagleBumped"]
  );
});

test("does stay quiet about an eagle that was already gone before the attempt", () => {
  const knockedEagles = [{ gate: 2, tick: -1 }];

  assert.deepEqual(
    resolveMirrorEvents(frame({ tick: 0, knockedEagles }), frame({ tick: 3, knockedEagles }), []),
    []
  );
});

test("does report a splat when a glob lands on the bird", () => {
  assert.deepEqual(
    resolveMirrorEvents(
      frame({ tick: 9 }),
      frame({ tick: 10, splats: [{ gate: 1, launchTick: 4, tick: 10 }] }),
      []
    ),
    ["splat"]
  );
});

test("does report the crash when the attempt ends in the sand", () => {
  assert.deepEqual(
    resolveMirrorEvents(frame({ tick: 40 }), frame({ tick: 41, outcome: "crashed" }), []),
    ["crashed"]
  );
});

test("does report the landing when the attempt ends on the plateau", () => {
  assert.deepEqual(
    resolveMirrorEvents(frame({ tick: 40 }), frame({ tick: 41, outcome: "cleared" }), []),
    ["landed"]
  );
});

test("does report an outcome once when the mirror redraws a settled frame", () => {
  assert.deepEqual(
    resolveMirrorEvents(
      frame({ tick: 41, outcome: "crashed" }),
      frame({ tick: 41, outcome: "crashed" }),
      []
    ),
    []
  );
});

test("does report the flight and its end in the order the room sees them", () => {
  assert.deepEqual(
    resolveMirrorEvents(
      frame({ tick: 20, gatesCleared: 2 }),
      frame({
        tick: 21,
        gatesCleared: 3,
        splats: [{ gate: 3, launchTick: 8, tick: 21 }],
        outcome: "crashed"
      }),
      [20]
    ),
    ["flap", "gateCleared", "splat", "crashed"]
  );
});
