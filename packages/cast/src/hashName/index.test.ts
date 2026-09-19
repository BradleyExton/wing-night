import assert from "node:assert/strict";
import test from "node:test";

import { hashName } from "./index.js";

test("does hash the same name to the same number whatever its case or padding", () => {
  assert.equal(hashName(" Brad "), hashName("brad"));
  assert.equal(hashName("BRAD"), hashName("brad"));
  assert.notEqual(hashName("brad"), hashName("morgan"));
});

test("does spread a roster across a hash's own bit ranges", () => {
  const names = ["Alex", "Morgan", "Sam", "Jo", "Rob", "Casey", "Pat", "Ash"];
  const low = new Set(names.map((name) => hashName(name) % 6));
  const high = new Set(names.map((name) => (hashName(name) >>> 4) % 6));

  assert.ok(low.size > 1 && high.size > 1, "a bit range collapsed a roster onto one value");
});
