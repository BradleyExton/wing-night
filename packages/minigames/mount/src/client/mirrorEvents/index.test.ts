import assert from "node:assert/strict";
import test from "node:test";

import { createMountPile, createMountState, type MountState } from "@wingnight/shared";

import { resolveMirrorEvents } from "./index.js";

const start = (): MountState => {
  return createMountState(20261002, createMountPile(20261002), { climbSeconds: 30, secondsPerHen: 3 }, "player-1");
};

test("does announce a slip, a grab and a thud when the climb gained one of each", () => {
  const previous = start();
  const next: MountState = {
    ...previous,
    tick: previous.tick + 1,
    grabs: [{ tick: 0, limb: "beak" }],
    letGoes: [{ tick: 0, limb: "footLeft" }],
    falls: [0]
  };

  assert.deepEqual(resolveMirrorEvents(previous, next), [{ kind: "slip" }, { kind: "grab" }, { kind: "thud" }]);
});

test("does announce nothing when a rebuild hands back an earlier state", () => {
  const previous: MountState = { ...start(), tick: 40, grabs: [{ tick: 3, limb: "wing" }] };

  assert.deepEqual(resolveMirrorEvents(previous, start()), []);
});
