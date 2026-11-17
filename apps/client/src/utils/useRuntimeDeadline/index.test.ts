import assert from "node:assert/strict";
import test from "node:test";

import { RUNTIME_DEADLINE_GRACE_MS, resolveDeadlineDelayMs } from "./index";

test("does wait out the time left plus the grace when the deadline is ahead", () => {
  assert.equal(resolveDeadlineDelayMs(5_000, 2_000), 3_000 + RUNTIME_DEADLINE_GRACE_MS);
});

test("does fire after only the grace when the deadline has already passed", () => {
  assert.equal(resolveDeadlineDelayMs(1_000, 9_000), RUNTIME_DEADLINE_GRACE_MS);
});
