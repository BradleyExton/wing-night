import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicMinigameRun } from "@wingnight/shared";

import { CLEARED_BEAT_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";
import { resolveHoldDurationMs, resolveRunHold } from "./index.js";

const run = (
  runIndex: number,
  status: SchlonicMinigameRun["status"],
  outcome: "cleared" | "wiped" | "fell" | null = null
): SchlonicMinigameRun => ({
  runIndex,
  player: null,
  status,
  inputs: [],
  skipped: false,
  result: outcome === null ? null : { outcome, endTick: 100, wings: 9, distance: 400 }
});

const view = (runIndex: number, runs: SchlonicMinigameRun[]) => ({
  runIndex,
  runsPerTurn: 2,
  runs
});

test("holds nothing on the first paint, when there is no previous run to hold", () => {
  assert.equal(resolveRunHold(null, view(0, [run(0, "ready")]), 0), null);
});

test("holds the run that just ended, and says how", () => {
  const hold = resolveRunHold(0, view(1, [run(0, "done", "fell"), run(1, "ready")]), 500);

  assert.equal(hold?.runIndex, 0);
  assert.equal(hold?.outcome, "fell");
  assert.equal(hold?.kind, "handoff");
});

test("calls the last run of the turn a finish rather than a handoff", () => {
  const hold = resolveRunHold(1, view(2, [run(0, "done", "cleared"), run(1, "done", "cleared")]), 0);

  assert.equal(hold?.kind, "finish");
});

test("reads a skipped run as one that never happened", () => {
  const hold = resolveRunHold(0, view(1, [run(0, "done"), run(1, "ready")]), 0);

  assert.equal(hold?.outcome, "wiped");
});

test("holds nothing when the cursor went backwards, which is a reset", () => {
  assert.equal(resolveRunHold(1, view(0, [run(0, "ready"), run(1, "ready")]), 0), null);
});

test("lingers longer on a run that made the post than on one that did not", () => {
  const cleared = resolveRunHold(0, view(1, [run(0, "done", "cleared"), run(1, "ready")]), 0);
  const wiped = resolveRunHold(0, view(1, [run(0, "done", "wiped"), run(1, "ready")]), 0);

  assert.ok(cleared !== null && wiped !== null);
  assert.equal(resolveHoldDurationMs(cleared), CLEARED_BEAT_MS);
  assert.equal(resolveHoldDurationMs(wiped), WIPEOUT_BEAT_MS);
  assert.ok(CLEARED_BEAT_MS > WIPEOUT_BEAT_MS);
});
