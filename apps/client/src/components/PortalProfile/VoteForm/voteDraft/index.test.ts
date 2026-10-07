import assert from "node:assert/strict";
import test from "node:test";
import { PORTAL_GENRES, isGuestVote } from "@wingnight/shared/guestPortal";

import {
  EMPTY_VOTE_DRAFT,
  draftFromVote,
  moveGenre,
  rankGenre,
  toGuestVote,
  toggleWish,
  unrankGenre,
  unrankedGenres
} from "./index";

test("does serialise a ranked prefix, the wishes and the format into the API's vote when the form is complete", () => {
  const vote = toGuestVote({ ranking: ["disco", "metal"], wishes: ["g_ana"], format: "random_draw" });

  assert.deepEqual(vote, { genreRanking: ["disco", "metal"], teammateWishes: ["g_ana"], teamFormat: "random_draw" });
  assert.equal(isGuestVote(vote, "g_self"), true);
});

test("does refuse to serialise when no genre is ranked or no format is picked", () => {
  assert.equal(toGuestVote(EMPTY_VOTE_DRAFT), null);
  assert.equal(toGuestVote({ ranking: ["pop"], wishes: [], format: null }), null);
  assert.equal(toGuestVote({ ranking: [], wishes: [], format: "guests_pick" }), null);
});

test("does round-trip a saved vote into the form when it is read back", () => {
  const saved = { genreRanking: ["rock" as const], teammateWishes: ["g_a", "g_gone"], teamFormat: "host_assigns" as const };

  assert.deepEqual(draftFromVote(saved, new Set(["g_a"])), { ranking: ["rock"], wishes: ["g_a"], format: "host_assigns" });
  assert.deepEqual(draftFromVote(null, null), EMPTY_VOTE_DRAFT);
});

test("does swap neighbours when a genre moves up or down, and nothing at either end", () => {
  assert.deepEqual(moveGenre(["pop", "rock", "disco"], 2, -1), ["pop", "disco", "rock"]);
  assert.deepEqual(moveGenre(["pop", "rock"], 0, -1), ["pop", "rock"]);
  assert.deepEqual(moveGenre(["pop", "rock"], 1, 1), ["pop", "rock"]);
});

test("does keep every genre exactly once when genres are ranked and unranked", () => {
  const ranking = unrankGenre(rankGenre(rankGenre(["metal"], "pop"), "pop"), "metal");

  assert.deepEqual(ranking, ["pop"]);
  assert.equal(unrankedGenres(ranking).length, PORTAL_GENRES.length - 1);
  assert.equal(unrankedGenres(ranking).includes("pop"), false);
});

test("does refuse a third teammate wish rather than drop one", () => {
  assert.deepEqual(toggleWish(["g_a", "g_b"], "g_c"), ["g_a", "g_b"]);
  assert.deepEqual(toggleWish(["g_a", "g_b"], "g_a"), ["g_b"]);
});
