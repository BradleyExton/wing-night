import assert from "node:assert/strict";
import test from "node:test";

import { resolvePinCue } from "./index.js";

test("does plop when the pin lands somewhere new", () => {
  assert.equal(resolvePinCue(null, "1,2"), "plop");
  assert.equal(resolvePinCue("1,2", "3,4"), "plop");
});

test("does stay quiet on the first reading, on a lifted pin, and on a pin that has not moved", () => {
  assert.equal(resolvePinCue(undefined, "1,2"), null);
  assert.equal(resolvePinCue("1,2", null), null);
  assert.equal(resolvePinCue("1,2", "1,2"), null);
});
