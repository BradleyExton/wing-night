import assert from "node:assert/strict";
import test from "node:test";
import type { SchlonicMinigameRun } from "@wingnight/shared";

import { CLEARED_BEAT_MS, PUNCHLINE_MS, WIPEOUT_BEAT_MS } from "../beats/index.js";
import { resolveCardDelayMs, resolveHoldDurationMs, resolveRunHold } from "./index.js";

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

test("reads a skipped run as one that never happened, not as a wipeout", () => {
  const skipped: SchlonicMinigameRun = { ...run(0, "done"), skipped: true };
  const hold = resolveRunHold(0, view(1, [skipped, run(1, "ready")]), 0);

  assert.equal(hold?.outcome, "skipped");
  assert.equal(hold?.wings, 0);
});

test("holds nothing when the cursor went backwards, which is a reset", () => {
  assert.equal(resolveRunHold(1, view(0, [run(0, "ready"), run(1, "ready")]), 0), null);
});

test("does hold a run that went wrong for its punchline and then a card as long as the post's", () => {
  const cleared = resolveRunHold(0, view(1, [run(0, "done", "cleared"), run(1, "ready")]), 0);
  const wiped = resolveRunHold(0, view(1, [run(0, "done", "wiped"), run(1, "ready")]), 0);

  assert.ok(cleared !== null && wiped !== null);
  assert.equal(resolveHoldDurationMs(cleared), CLEARED_BEAT_MS);
  assert.equal(resolveHoldDurationMs(wiped), WIPEOUT_BEAT_MS);
  // The joke plays first; the card that follows it is up about as long as the post's beat.
  assert.ok(WIPEOUT_BEAT_MS - PUNCHLINE_MS >= CLEARED_BEAT_MS * 0.7);
});

test("does keep the wall's card down for the punchline when the run fell or was wiped", () => {
  for (const outcome of ["fell", "wiped"] as const) {
    const hold = resolveRunHold(0, view(1, [run(0, "done", outcome), run(1, "ready")]), 0);

    assert.ok(hold !== null);
    assert.equal(resolveCardDelayMs(hold), PUNCHLINE_MS);
  }

  const cleared = resolveRunHold(0, view(1, [run(0, "done", "cleared"), run(1, "ready")]), 0);

  assert.ok(cleared !== null);
  assert.equal(resolveCardDelayMs(cleared), 0);
});
