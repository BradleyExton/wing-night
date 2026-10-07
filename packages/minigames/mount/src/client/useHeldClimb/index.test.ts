import assert from "node:assert/strict";
import test from "node:test";

import type { MountMinigameClimb } from "@wingnight/shared";

import { resolveClimbHold, resolveShownClimbIndex } from "./index.js";

const climb = (overrides: Partial<MountMinigameClimb>): MountMinigameClimb => ({
  climbIndex: 0,
  player: null,
  status: "ready",
  climbTicks: 1800,
  inputs: [],
  skipped: false,
  result: null,
  ...overrides
});

const view = (climbIndex: number, climbs: MountMinigameClimb[], pointsSoFar: number) => ({
  climbIndex,
  climbsPerTurn: 3,
  climbs,
  pointsSoFar
});

test("does hold the climb that just mounted when the cursor moves on, with the points it banked", () => {
  const climbs = [
    climb({ status: "done", result: { outcome: "mounted", endTick: 458, share: 1, bestHeight: 161, falls: 0 } }),
    climb({ climbIndex: 1 }),
    climb({ climbIndex: 2 })
  ];
  const hold = resolveClimbHold({ climbIndex: 0, pointsSoFar: 0 }, view(1, climbs, 5), 100);

  assert.deepEqual(hold, { climbIndex: 0, outcome: "mounted", share: 1, points: 5, kind: "handoff", startedAtMs: 100 });
});

test("does call a skipped climb skipped and the last one the finish", () => {
  const climbs = [
    climb({ status: "done" }),
    climb({ climbIndex: 1, status: "done" }),
    climb({ climbIndex: 2, status: "done", skipped: true })
  ];
  const hold = resolveClimbHold({ climbIndex: 2, pointsSoFar: 4 }, view(3, climbs, 4), 0);

  assert.equal(hold?.outcome, "skipped");
  assert.equal(hold?.kind, "finish");
  assert.equal(hold?.points, 0);
});

test("does hold nothing when the cursor goes back, as on a reset", () => {
  assert.equal(resolveClimbHold({ climbIndex: 2, pointsSoFar: 5 }, view(0, [climb({})], 0), 0), null);
});

test("does draw the last climb once the team is through and no hold is running", () => {
  assert.equal(resolveShownClimbIndex({ climbIndex: 3, climbsPerTurn: 3 }, null), 2);
});
