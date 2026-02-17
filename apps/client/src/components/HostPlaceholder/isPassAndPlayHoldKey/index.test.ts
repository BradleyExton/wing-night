import assert from "node:assert/strict";
import test from "node:test";

import { isPassAndPlayHoldKey } from "./index";

test("returns true for supported hold keys", () => {
  assert.equal(isPassAndPlayHoldKey(" "), true);
  assert.equal(isPassAndPlayHoldKey("Spacebar"), true);
  assert.equal(isPassAndPlayHoldKey("Enter"), true);
});

test("returns false for unsupported keys", () => {
  assert.equal(isPassAndPlayHoldKey("Escape"), false);
  assert.equal(isPassAndPlayHoldKey("Tab"), false);
  assert.equal(isPassAndPlayHoldKey("a"), false);
});
