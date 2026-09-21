import assert from "node:assert/strict";
import test from "node:test";

import { resolveGameStartCountdownSeconds } from "./index";

test("counts whole seconds down to one when a countdown is armed", () => {
  const endsAt = 10_000;

  assert.equal(resolveGameStartCountdownSeconds(endsAt, 7_000), 3);
  assert.equal(resolveGameStartCountdownSeconds(endsAt, 7_400), 3);
  assert.equal(resolveGameStartCountdownSeconds(endsAt, 8_000), 2);
  assert.equal(resolveGameStartCountdownSeconds(endsAt, 9_000), 1);
  assert.equal(resolveGameStartCountdownSeconds(endsAt, 9_900), 1);
});

test("reads as no countdown when none is armed", () => {
  assert.equal(resolveGameStartCountdownSeconds(null, 7_000), null);
});

// Never zero: a host that armed the count-in and then dropped off would
// otherwise leave the TV sat on a 0 forever. Null puts the lock screen back on
// its ready label, and the host's next tap starts the night immediately.
test("reads as no countdown once the instant has passed", () => {
  assert.equal(resolveGameStartCountdownSeconds(10_000, 10_000), null);
  assert.equal(resolveGameStartCountdownSeconds(10_000, 12_000), null);
});
