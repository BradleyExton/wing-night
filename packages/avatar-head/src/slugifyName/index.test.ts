import assert from "node:assert/strict";
import test from "node:test";

import { slugifyName } from "./index.ts";

test("does slug a name with spaces, case and punctuation into a file name when given one", () => {
  assert.equal(slugifyName("  Steve B "), "steve-b");
  assert.equal(slugifyName("Joleeza!"), "joleeza");
  assert.equal(slugifyName("--Mary  Kate--"), "mary-kate");
});

test("does fold accents to their plain letters when a name carries them", () => {
  assert.equal(slugifyName("Zoë"), "zoe");
  assert.equal(slugifyName("José"), "jose");
  assert.equal(slugifyName("Ångström Ñu"), "angstrom-nu");
  assert.notEqual(slugifyName("José"), slugifyName("Jos"));
});
