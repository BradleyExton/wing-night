import assert from "node:assert/strict";
import test from "node:test";

import { resolveRemainingTimerSeconds } from "./index";

test("returns remaining seconds from paused timer snapshot", () => {
  assert.equal(
    resolveRemainingTimerSeconds(
      {
        isPaused: true,
        remainingMs: 29_900,
        endsAt: 0
      },
      0
    ),
    30
  );
});

test("returns remaining seconds from running timer snapshot", () => {
  assert.equal(
    resolveRemainingTimerSeconds(
      {
        isPaused: false,
        remainingMs: 0,
        endsAt: 1_250
      },
      0
    ),
    2
  );
});

test("clamps remaining seconds to zero when running timer has elapsed", () => {
  assert.equal(
    resolveRemainingTimerSeconds(
      {
        isPaused: false,
        remainingMs: 0,
        endsAt: 0
      },
      10_000
    ),
    0
  );
});
