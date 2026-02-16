import assert from "node:assert/strict";
import test from "node:test";

import { resolveClientRoute } from "./index";

test("resolves /host and /host/ to HOST", () => {
  assert.equal(resolveClientRoute("/host"), "HOST");
  assert.equal(resolveClientRoute("/host/"), "HOST");
});

test("resolves /display and /display/ to DISPLAY", () => {
  assert.equal(resolveClientRoute("/display"), "DISPLAY");
  assert.equal(resolveClientRoute("/display/"), "DISPLAY");
});

test("resolves unknown routes to NOT_FOUND", () => {
  assert.equal(resolveClientRoute("/"), "NOT_FOUND");
  assert.equal(resolveClientRoute("/anything-else"), "NOT_FOUND");
});
