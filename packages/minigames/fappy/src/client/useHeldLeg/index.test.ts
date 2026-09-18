import assert from "node:assert/strict";
import test from "node:test";
import type { FappyMinigameLeg } from "@wingnight/shared";

import { resolveLegHold } from "./index.js";

const leg = (legIndex: number, status: FappyMinigameLeg["status"]): FappyMinigameLeg => ({
  legIndex,
  player: null,
  seed: 1,
  status,
  attempt: 0,
  checkpointGate: 0,
  flapTicks: [],
  crashes: 0,
  skipped: false,
  knockedEagles: [],
  lastRun: null
});

test("does hold the cleared leg for a handoff when the leg in hand moves on", () => {
  const hold = resolveLegHold(0, { legIndex: 1, legsPerTurn: 3, legs: [leg(0, "cleared"), leg(1, "ready"), leg(2, "ready")] }, 500);

  assert.deepEqual(hold, { legIndex: 0, kind: "handoff", startedAtMs: 500 });
});

test("does hold the last leg for the finish when the relay is through", () => {
  const hold = resolveLegHold(2, { legIndex: 3, legsPerTurn: 3, legs: [leg(0, "cleared"), leg(1, "cleared"), leg(2, "cleared")] }, 9);

  assert.deepEqual(hold, { legIndex: 2, kind: "finish", startedAtMs: 9 });
});

test("does not hold on the first view, on a reset, or when the leg in hand is unchanged", () => {
  const legs = [leg(0, "cleared"), leg(1, "ready")];

  assert.equal(resolveLegHold(null, { legIndex: 1, legsPerTurn: 2, legs }, 0), null);
  assert.equal(resolveLegHold(1, { legIndex: 0, legsPerTurn: 2, legs: [leg(0, "ready"), leg(1, "ready")] }, 0), null);
  assert.equal(resolveLegHold(1, { legIndex: 1, legsPerTurn: 2, legs }, 0), null);
});

test("does not hold when the leg left behind was not cleared", () => {
  assert.equal(resolveLegHold(0, { legIndex: 1, legsPerTurn: 2, legs: [leg(0, "ready"), leg(1, "ready")] }, 0), null);
});
