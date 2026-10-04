import assert from "node:assert/strict";
import test from "node:test";

import { GENRE_KEYS } from "../../teamTheme/index.js";
import { PORTAL_GENRES, isGuestVote, resolveGenreBordaPoints } from "./index.js";

const SELF = "g_self";
const validVote = {
  genreRanking: ["metal", "disco"],
  teammateWishes: ["g_rob", "g_ana"],
  teamFormat: "guests_pick"
};

test("does accept a ranked prefix, two wishes and a known format when the vote is well formed", () => {
  assert.equal(isGuestVote(validVote, SELF), true);
  assert.equal(isGuestVote({ ...validVote, teammateWishes: [] }, SELF), true);
  assert.equal(isGuestVote({ ...validVote, genreRanking: [...PORTAL_GENRES] }, SELF), true);
});

test("does reject the vote when a guest wishes for themself", () => {
  assert.equal(isGuestVote({ ...validVote, teammateWishes: ["g_rob", SELF] }, SELF), false);
});

test("does reject the vote when it names more than two teammates or one twice", () => {
  assert.equal(isGuestVote({ ...validVote, teammateWishes: ["g_a", "g_b", "g_c"] }, SELF), false);
  assert.equal(isGuestVote({ ...validVote, teammateWishes: ["g_a", "g_a"] }, SELF), false);
});

test("does reject the vote when a genre is unknown, repeated, none, or the ranking is empty", () => {
  assert.equal(isGuestVote({ ...validVote, genreRanking: ["metal", "polka"] }, SELF), false);
  assert.equal(isGuestVote({ ...validVote, genreRanking: ["metal", "metal"] }, SELF), false);
  assert.equal(isGuestVote({ ...validVote, genreRanking: ["none"] }, SELF), false);
  assert.equal(isGuestVote({ ...validVote, genreRanking: [] }, SELF), false);
});

test("does reject the vote when the team format is unknown or missing", () => {
  assert.equal(isGuestVote({ ...validVote, teamFormat: "arm_wrestle" }, SELF), false);
  assert.equal(isGuestVote({ genreRanking: ["metal"], teammateWishes: [] }, SELF), false);
});

test("does offer every team genre but none when the ballot is built", () => {
  assert.deepEqual(PORTAL_GENRES, GENRE_KEYS.filter((genre) => genre !== "none"));
});

test("does score a first choice the ballot's length and leave unranked genres out when tallying", () => {
  const points = resolveGenreBordaPoints(["pop", "rock"]);

  assert.equal(points.get("pop"), PORTAL_GENRES.length);
  assert.equal(points.get("rock"), PORTAL_GENRES.length - 1);
  assert.equal(points.has("metal"), false);
});
