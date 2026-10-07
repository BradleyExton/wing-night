import assert from "node:assert/strict";
import test from "node:test";

import { createMountPile, createMountState, type MountInputSample, type MountState } from "@wingnight/shared";

import { createRunFingers } from "./index.js";

const at = (tick: number, overrides: Partial<MountState> = {}): MountState => ({
  ...createMountState(20261002, createMountPile(20261002), { climbSeconds: 30, secondsPerHen: 3 }, "player-1"),
  tick,
  ...overrides
});

test("does log a grab, a throttled move and a release when one finger drags a limb", () => {
  const fingers = createRunFingers();
  const log: MountInputSample[] = [];

  fingers.grab(1, "wing", { x: -136, y: -16 }, at(0), log);
  fingers.move(1, { x: -130, y: -20 }, at(0), log);
  // One tick later the limb may not move again; the move waits for tick 2.
  fingers.move(1, { x: -120, y: -30 }, at(1), log);
  fingers.logDueMoves(at(1), log);
  fingers.logDueMoves(at(2), log);
  fingers.release(1, at(5), log);

  assert.deepEqual(
    log.map((sample) => `${sample.tick}:${sample.kind}:${sample.x},${sample.y}`),
    ["0:grab-start:-136,-16", "0:move:-130,-20", "2:move:-120,-30", "5:release:-120,-30"]
  );
  assert.equal(fingers.count(), 0);
});

test("does let two fingers own two limbs when two thumbs are down", () => {
  const fingers = createRunFingers();
  const log: MountInputSample[] = [];

  fingers.grab(1, "footLeft", { x: 0, y: 0 }, at(0), log);
  fingers.grab(2, "beak", { x: 10, y: -40 }, at(0), log);

  assert.deepEqual([...fingers.ownedLimbs()].sort(), ["beak", "footLeft"]);
});

test("does log nothing when a finger lifts while the hen is still being set upright", () => {
  const fingers = createRunFingers();
  const log: MountInputSample[] = [];

  fingers.grab(1, "wing", { x: 0, y: 0 }, at(0), log);
  fingers.release(1, at(10, { recoveringUntilTick: 40 }), log);

  assert.equal(log.length, 1);
});
