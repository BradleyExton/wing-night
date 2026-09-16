import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRosterNameSet,
  findUnknownFeaturedPlayers,
  hasMalformedFeaturedPlayers,
  isFeaturedOnRoster,
  isFeaturedPlayers,
  readFeaturedPlayers
} from "./index.js";

const roster = buildRosterNameSet(["Alex", "Jordan", "Taylor"]);

test("accepts an array of non-empty names", () => {
  assert.equal(isFeaturedPlayers(["Alex", "Jordan"]), true);
});

test("accepts an empty array", () => {
  assert.equal(isFeaturedPlayers([]), true);
});

test("rejects the array when any entry is blank", () => {
  assert.equal(isFeaturedPlayers(["Alex", "  "]), false);
});

test("rejects a value that is not an array", () => {
  assert.equal(isFeaturedPlayers("Alex"), false);
});

test("reads tags off a prompt that carries them", () => {
  assert.deepEqual(readFeaturedPlayers({ id: "p1", featuredPlayers: ["Alex"] }), [
    "Alex"
  ]);
});

test("reads null when a prompt carries no tags", () => {
  assert.equal(readFeaturedPlayers({ id: "p1" }), null);
});

test("reads null when a prompt's tags are malformed", () => {
  assert.equal(readFeaturedPlayers({ id: "p1", featuredPlayers: [3] }), null);
});

test("keeps an untagged prompt when the roster is anyone", () => {
  assert.equal(isFeaturedOnRoster(null, roster), true);
});

test("keeps a prompt tagged with an empty array", () => {
  assert.equal(isFeaturedOnRoster([], roster), true);
});

test("keeps a prompt when one of several tagged players is on the roster", () => {
  assert.equal(isFeaturedOnRoster(["Jordan", "Sam", "Robin"], roster), true);
});

test("drops a prompt when no tagged player is on the roster", () => {
  assert.equal(isFeaturedOnRoster(["Sam", "Robin"], roster), false);
});

test("keeps a prompt when a tag differs from the roster only by case and padding", () => {
  assert.equal(isFeaturedOnRoster(["  aLeX "], roster), true);
});

test("reports tags matching nobody on the roster", () => {
  assert.deepEqual(findUnknownFeaturedPlayers(["Alex", "Jordn"], roster), ["Jordn"]);
});

test("reports no unknown tags when a prompt is untagged", () => {
  assert.deepEqual(findUnknownFeaturedPlayers(null, roster), []);
});

test("flags a prompt whose tags are not an array of names", () => {
  assert.equal(hasMalformedFeaturedPlayers({ id: "p1", featuredPlayers: "Alex" }), true);
});

test("does not flag a prompt that carries no tags", () => {
  assert.equal(hasMalformedFeaturedPlayers({ id: "p1" }), false);
});

test("does not flag a prompt whose tags are a valid empty array", () => {
  assert.equal(hasMalformedFeaturedPlayers({ id: "p1", featuredPlayers: [] }), false);
});
