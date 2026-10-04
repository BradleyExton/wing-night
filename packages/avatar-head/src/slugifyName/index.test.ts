import assert from "node:assert/strict";
import test from "node:test";

import { slugifyName } from "./index.ts";

test("does slug a name with spaces, case and punctuation into a file name when given one", () => {
  assert.equal(slugifyName("  Steve B "), "steve-b");
  assert.equal(slugifyName("Joleeza!"), "joleeza");
  assert.equal(slugifyName("--Mary  Kate--"), "mary-kate");
});
