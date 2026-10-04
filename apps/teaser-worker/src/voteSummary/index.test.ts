import assert from "node:assert/strict";
import test from "node:test";

import { PORTAL_GENRES, type PortalGuest } from "@wingnight/shared/guestPortal";

import { resolveVoteSummary } from "./index.ts";

const GUESTS: PortalGuest[] = [
  { guestId: "g_a", displayName: "Ana" },
  { guestId: "g_b", displayName: "Bo" },
  { guestId: "g_c", displayName: "Cy" },
  { guestId: "g_d", displayName: "Di" }
];

test("does rank genres by Borda total and break ties on first choices when votes are summarized", () => {
  const summary = resolveVoteSummary(GUESTS, [
    { guestId: "g_a", vote: { genreRanking: ["rock", "pop"], teammateWishes: [], teamFormat: "random_draw" } },
    { guestId: "g_b", vote: { genreRanking: ["pop", "rock"], teammateWishes: [], teamFormat: "random_draw" } },
    { guestId: "g_c", vote: { genreRanking: ["pop"], teammateWishes: [], teamFormat: "host_assigns" } }
  ]);
  const top = PORTAL_GENRES.length;

  assert.deepEqual(summary.genreTallies.slice(0, 2), [
    { genre: "pop", points: top + top + (top - 1), firstChoices: 2 },
    { genre: "rock", points: top + (top - 1), firstChoices: 1 }
  ]);
  assert.equal(summary.genreTallies.length, PORTAL_GENRES.length);
  assert.deepEqual(summary.formatTallies, { host_assigns: 1, guests_pick: 0, random_draw: 2 });
  assert.deepEqual(summary.notVoted, [{ guestId: "g_d", displayName: "Di" }]);
});

test("does pair two guests only when each wished for the other", () => {
  const summary = resolveVoteSummary(GUESTS, [
    { guestId: "g_a", vote: { genreRanking: ["pop"], teammateWishes: ["g_b", "g_c"], teamFormat: "guests_pick" } },
    { guestId: "g_b", vote: { genreRanking: ["pop"], teammateWishes: ["g_a"], teamFormat: "guests_pick" } },
    { guestId: "g_c", vote: { genreRanking: ["pop"], teammateWishes: ["g_d"], teamFormat: "guests_pick" } }
  ]);

  assert.deepEqual(summary.mutualWishes, [{ guests: [GUESTS[0], GUESTS[1]] }]);
});

test("does report an empty room when nobody has voted", () => {
  const summary = resolveVoteSummary(GUESTS, []);

  assert.equal(summary.voterCount, 0);
  assert.ok(summary.genreTallies.every((tally) => tally.points === 0));
  assert.equal(summary.notVoted.length, GUESTS.length);
});
