import assert from "node:assert/strict";
import test from "node:test";

import { isTeamColorToken, resolveGenreKey } from "./index.js";

test("does map every genre keyword to its key when the genre names one", () => {
  assert.equal(resolveGenreKey("metal"), "metal");
  assert.equal(resolveGenreKey("punk"), "punk");
  assert.equal(resolveGenreKey("grunge"), "rock");
  assert.equal(resolveGenreKey("pop"), "pop");
  assert.equal(resolveGenreKey("bluegrass"), "country");
  assert.equal(resolveGenreKey("funk"), "disco");
  assert.equal(resolveGenreKey("hip-hop"), "hiphop");
  assert.equal(resolveGenreKey("rap"), "hiphop");
  assert.equal(resolveGenreKey("techno"), "electronic");
  assert.equal(resolveGenreKey("opera"), "classical");
});

test("does match loosely when the genre is cased, padded or wordy", () => {
  assert.equal(resolveGenreKey("  Heavy METAL "), "metal");
  assert.equal(resolveGenreKey("Country & Western"), "country");
  assert.equal(resolveGenreKey("90s Hip Hop"), "hiphop");
});

test("does read punk rock as punk because punk is checked before rock", () => {
  assert.equal(resolveGenreKey("punk rock"), "punk");
  assert.equal(resolveGenreKey("Rock"), "rock");
});

test("does fall back to none when the genre is missing, blank or unknown", () => {
  assert.equal(resolveGenreKey(undefined), "none");
  assert.equal(resolveGenreKey("   "), "none");
  assert.equal(resolveGenreKey("polka"), "none");
});

test("does accept only the eight team tokens as a colour", () => {
  assert.equal(isTeamColorToken("teamA"), true);
  assert.equal(isTeamColorToken("teamH"), true);
  assert.equal(isTeamColorToken("teamI"), false);
  assert.equal(isTeamColorToken("#f43f5e"), false);
  assert.equal(isTeamColorToken(4), false);
});
