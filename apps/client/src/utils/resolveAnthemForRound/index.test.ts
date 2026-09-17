import assert from "node:assert/strict";
import test from "node:test";

import { resolveAnthemForRound } from "./index";

const ANTHEMS = ["one.mp3", "two.mp3", "three.mp3"];

test("advances one anthem per round", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 1), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 2), "two.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 3), "three.mp3");
});

test("wraps back to the first anthem when rounds outlast the playlist", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 4), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, 5), "two.mp3");
});

// The property a mid-phase display refresh depends on.
test("resolves the same anthem for the same round every time", () => {
  assert.equal(
    resolveAnthemForRound(ANTHEMS, 2),
    resolveAnthemForRound(ANTHEMS, 2)
  );
});

test("keeps a single-anthem team on its one anthem", () => {
  assert.equal(resolveAnthemForRound(["only.mp3"], 7), "only.mp3");
});

test("falls back to the first anthem before the first round starts", () => {
  assert.equal(resolveAnthemForRound(ANTHEMS, 0), "one.mp3");
  assert.equal(resolveAnthemForRound(ANTHEMS, null), "one.mp3");
});

test("resolves nothing for a team with no anthems", () => {
  assert.equal(resolveAnthemForRound([], 1), null);
  assert.equal(resolveAnthemForRound(null, 1), null);
});
