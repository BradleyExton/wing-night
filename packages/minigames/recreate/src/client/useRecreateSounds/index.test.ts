import assert from "node:assert/strict";
import test from "node:test";

import { resolveAttemptCue, resolveIngredientCue } from "./index.js";

test("does whoosh a prompt sent off, ring a forgery that arrives, and fizzle one that failed", () => {
  assert.equal(resolveAttemptCue(null, "generating"), "whoosh");
  assert.equal(resolveAttemptCue("generating", "ready"), "arrive");
  assert.equal(resolveAttemptCue("generating", "failed"), "fizzle");
});

test("does stay quiet on a skip, on no change, and on no attempt", () => {
  assert.equal(resolveAttemptCue("generating", "skipped"), null);
  assert.equal(resolveAttemptCue("ready", "ready"), null);
  assert.equal(resolveAttemptCue("ready", null), null);
});

test("does tick a box on and off by the count of checked ingredients", () => {
  assert.equal(resolveIngredientCue(1, 2), "tickOn");
  assert.equal(resolveIngredientCue(2, 1), "tickOff");
  assert.equal(resolveIngredientCue(2, 2), null);
});
