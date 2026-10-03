import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlMinigameBlock } from "@wingnight/shared";

import { CLEARED_BEAT_MS, KO_BEAT_MS, TIMEOUT_BEAT_MS } from "../beats/index.js";
import { resolveBlockHold, resolveBlockHoldDurationMs, resolveShownBlockIndex } from "./index.js";

const block = (
  blockIndex: number,
  status: BrawlMinigameBlock["status"],
  outcome: "cleared" | "ko" | "timeout" | null = null,
  skipped = false
): BrawlMinigameBlock => ({
  blockIndex,
  player: null,
  status,
  inputs: [],
  skipped,
  result: outcome === null ? null : { outcome, endTick: 900, goons: 5, hearts: 1 },
  heartBought: false
});

const view = (blockIndex: number, blocks: BrawlMinigameBlock[]) => ({ blockIndex, blocksPerTurn: 2, blocks });

test("does hold nothing on the first paint when there is no previous block", () => {
  assert.equal(resolveBlockHold(null, view(0, [block(0, "ready")]), 0), null);
});

test("does hold the block that just ended and say how when the cursor moves on", () => {
  const hold = resolveBlockHold(0, view(1, [block(0, "done", "ko"), block(1, "ready")]), 500);

  assert.equal(hold?.blockIndex, 0);
  assert.equal(hold?.outcome, "ko");
  assert.equal(hold?.goons, 5);
  assert.equal(hold?.kind, "handoff");
  assert.equal(hold?.startedAtMs, 500);
});

test("does call the last block of the turn a finish rather than a handoff", () => {
  const hold = resolveBlockHold(1, view(2, [block(0, "done", "cleared"), block(1, "done", "cleared")]), 0);

  assert.equal(hold?.kind, "finish");
});

test("does call a skipped block skipped rather than the bell", () => {
  const hold = resolveBlockHold(0, view(1, [block(0, "done", null, true), block(1, "ready")]), 0);

  assert.equal(hold?.outcome, "skipped");
  assert.equal(hold?.goons, 0);
});

test("does hold nothing when the cursor went back for a reset", () => {
  assert.equal(resolveBlockHold(1, view(0, [block(0, "ready"), block(1, "ready")]), 0), null);
});

test("does hold each ending for its own beat", () => {
  const hold = { blockIndex: 0, goons: 0, kind: "handoff" as const, startedAtMs: 0 };

  assert.equal(resolveBlockHoldDurationMs({ ...hold, outcome: "cleared" }), CLEARED_BEAT_MS);
  assert.equal(resolveBlockHoldDurationMs({ ...hold, outcome: "ko" }), KO_BEAT_MS);
  assert.equal(resolveBlockHoldDurationMs({ ...hold, outcome: "timeout" }), TIMEOUT_BEAT_MS);
});

test("does show the held block during a hold and the block in hand otherwise, never past the last", () => {
  const holding = { blockIndex: 0, goons: 0, kind: "finish" as const, startedAtMs: 0, outcome: "cleared" as const };

  assert.equal(resolveShownBlockIndex({ blockIndex: 1, blocksPerTurn: 2 }, holding), 0);
  assert.equal(resolveShownBlockIndex({ blockIndex: 1, blocksPerTurn: 2 }, null), 1);
  assert.equal(resolveShownBlockIndex({ blockIndex: 2, blocksPerTurn: 2 }, null), 1);
});
