import assert from "node:assert/strict";
import { test } from "node:test";

import * as surface from "./index.js";

test("loads as a module namespace when imported", () => {
  assert.equal(typeof surface, "object");
});
