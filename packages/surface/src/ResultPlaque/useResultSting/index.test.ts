import assert from "node:assert/strict";
import test from "node:test";

import { resolveResultSting } from "./index.js";

test("does sting a hit and a miss and say nothing on a neutral card", () => {
  assert.equal(resolveResultSting("hit"), "hit");
  assert.equal(resolveResultSting("miss"), "miss");
  assert.equal(resolveResultSting("neutral"), null);
});
