import assert from "node:assert/strict";
import test from "node:test";

import { resolveHoldBeatEvent } from "./index.js";

const hold = (outcome: "cleared" | "ko" | "timeout" | "skipped") => ({
  blockIndex: 0,
  outcome,
  goons: 3,
  kind: "handoff" as const,
  startedAtMs: 1000
});

test("does sound the handoff, the bay and the bell for the three ways a block ends", () => {
  assert.deepEqual(resolveHoldBeatEvent(hold("cleared")), { kind: "handoff" });
  assert.deepEqual(resolveHoldBeatEvent(hold("ko")), { kind: "bay" });
  assert.deepEqual(resolveHoldBeatEvent(hold("timeout")), { kind: "bell" });
});

test("does stay quiet when there is no hold or the block was skipped", () => {
  assert.equal(resolveHoldBeatEvent(null), null);
  assert.equal(resolveHoldBeatEvent(hold("skipped")), null);
});
