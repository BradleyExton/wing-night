import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminGuestStatus,
  isAdminPicksState,
  isAdminTeamBoard,
  isPortalMe,
  isPortalTeamList,
  isPortalTeamPicked,
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
  team: { teamName: "Iron Hens", outfitsByGenre: {} },
  picksClosed: false
};

test("does read a guest's own page when every field is the right shape", () => {
  assert.equal(isPortalMe(me), true);
  assert.equal(isPortalMe({ ...me, team: null, email: null }), true);
});

test("does refuse the guest's page when the avatar status, the pick or the switch is malformed", () => {
  assert.equal(isPortalMe({ ...me, avatar: { ...avatar, triesLeft: -1 } }), false);
  assert.equal(isPortalMe({ ...me, team: { teamName: "" } }), false);
  assert.equal(isPortalMe({ ...me, picksClosed: "no" }), false);
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
    team: "Iron Hens"
  };

  assert.equal(isAdminGuestStatus(row), true);
  assert.equal(isAdminGuestStatus({ ...row, team: null }), true);
  assert.equal(isAdminGuestStatus({ ...row, claimedAt: "yesterday" }), false);
  assert.equal(isAdminGuestStatus({ ...row, team: undefined }), false);
});

const member = { guestId: "g_rob", displayName: "Rob", headHash: "a".repeat(64) };
const teamList = {
  teams: [
    { id: "team-1", name: "Iron Hens", genre: "Metal", color: "teamB", members: [member] },
    { id: "team-2", name: "Plain", members: [{ ...member, guestId: "g_sam", displayName: "Sam", headHash: null }] }
  ],
  seatCap: 2,
  picksClosed: false
};

test("does read the team list when each team has its members and the genre and colour are absent or sound", () => {
  assert.equal(isPortalTeamList(teamList), true);
  assert.equal(isPortalTeamList({ ...teamList, teams: [] }), true);
  assert.equal(isPortalTeamList({ ...teamList, teams: [{ ...teamList.teams[0], color: "mauve" }] }), false);
  assert.equal(isPortalTeamList({ ...teamList, teams: [{ ...teamList.teams[0], genre: null }] }), false);
  assert.equal(isPortalTeamList({ ...teamList, teams: [{ ...teamList.teams[0], members: [{ guestId: "g" }] }] }), false);
  assert.equal(isPortalTeamList({ ...teamList, seatCap: 1.5 }), false);
  assert.equal(isPortalTeamList({ ...teamList, picksClosed: undefined }), false);
});

test("does read a pick's answer and the admin board as the list plus the pick or the unseated", () => {
  assert.equal(isPortalTeamPicked({ team: { teamName: "Iron Hens", outfitsByGenre: {} }, teams: teamList }), true);
  assert.equal(isPortalTeamPicked({ team: null, teams: teamList }), false);
  assert.equal(isAdminTeamBoard({ ...teamList, unseated: [member] }), true);
  assert.equal(isAdminTeamBoard({ ...teamList, unseated: [] }), true);
  assert.equal(isAdminTeamBoard(teamList), false);
  assert.equal(isAdminPicksState({ picksClosed: true }), true);
  assert.equal(isAdminPicksState({ picksClosed: 1 }), false);
});

test("does name the error code when a failed body carries a known one", () => {
  assert.equal(readPortalErrorCode({ error: "tries_exhausted" }), "tries_exhausted");
  assert.equal(readPortalErrorCode({ error: "kaboom" }), null);
  assert.equal(readPortalErrorCode("tries_exhausted"), null);
});
