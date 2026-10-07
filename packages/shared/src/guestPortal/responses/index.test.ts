import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminGuestStatus,
  isAdminVoteSummary,
  isPortalMe,
  readPortalErrorCode
} from "./index.js";

const avatar = { triesMax: 5, triesLeft: 3, hasPhoto: true, headHash: null };
const me = {
  guestId: "g_rob",
  displayName: "Rob",
  email: "rob@example.test",
  isAdmin: false,
  hasHead: false,
  avatar,
  vote: { genreRanking: ["disco", "metal"], teammateWishes: ["g_ana"], teamFormat: "random_draw" }
};

test("does read a guest's own page when every field is the right shape", () => {
  assert.equal(isPortalMe(me), true);
  assert.equal(isPortalMe({ ...me, vote: null, email: null }), true);
});

test("does refuse the guest's page when the avatar status or the vote is malformed", () => {
  assert.equal(isPortalMe({ ...me, avatar: { ...avatar, triesLeft: -1 } }), false);
  assert.equal(isPortalMe({ ...me, vote: { ...me.vote, teamFormat: "coin_toss" } }), false);
  assert.equal(isPortalMe({ ...me, isAdmin: "no" }), false);
});

test("does read an admin guest row when its timestamps are numbers or null", () => {
  const row = {
    guestId: "g_rob",
    displayName: "Rob",
    email: null,
    isAdmin: false,
    createdAt: 1,
    invitedAt: null,
    claimedAt: 2,
    lastSeenAt: null,
    hasHead: true,
    headHash: "abc",
    isStyleReference: false,
    triesLeft: 4,
    hasVoted: true
  };

  assert.equal(isAdminGuestStatus(row), true);
  assert.equal(isAdminGuestStatus({ ...row, claimedAt: "yesterday" }), false);
});

test("does read a vote summary when every format has a tally and each wish is a pair", () => {
  const summary = {
    voterCount: 2,
    genreTallies: [{ genre: "disco", points: 18, firstChoices: 2 }],
    mutualWishes: [{ guests: [{ guestId: "g_a", displayName: "A" }, { guestId: "g_b", displayName: "B" }] }],
    formatTallies: { host_assigns: 1, guests_pick: 0, random_draw: 1 },
    notVoted: [{ guestId: "g_c", displayName: "C" }]
  };

  assert.equal(isAdminVoteSummary(summary), true);
  assert.equal(isAdminVoteSummary({ ...summary, formatTallies: { host_assigns: 1 } }), false);
  assert.equal(
    isAdminVoteSummary({ ...summary, mutualWishes: [{ guests: [{ guestId: "g_a", displayName: "A" }] }] }),
    false
  );
});

test("does name the error code when a failed body carries a known one", () => {
  assert.equal(readPortalErrorCode({ error: "tries_exhausted" }), "tries_exhausted");
  assert.equal(readPortalErrorCode({ error: "kaboom" }), null);
  assert.equal(readPortalErrorCode("tries_exhausted"), null);
});
