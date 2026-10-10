import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminPicksRequest,
  isAdminTeamSeatRequest,
  isTeamPick,
  isTeamPickRequest,
  resolveTeamSeatCap,
  resolveThemeTeam
} from "./index.js";

test("does accept a pick whose outfits are per known genre and slot -> item strings", () => {
  assert.equal(isTeamPick({ teamName: "Iron Hens", outfitsByGenre: {} }), true);
  assert.equal(isTeamPick({ teamName: "Iron Hens", outfitsByGenre: { metal: { torso: "battle-vest" } } }), true);
});

test("does reject a pick when the name is empty, a genre is unknown or an item is not a string", () => {
  assert.equal(isTeamPick({ teamName: "", outfitsByGenre: {} }), false);
  assert.equal(isTeamPick({ teamName: "Iron Hens", outfitsByGenre: { polka: {} } }), false);
  assert.equal(isTeamPick({ teamName: "Iron Hens", outfitsByGenre: { metal: { torso: 3 } } }), false);
  assert.equal(isTeamPick({ teamName: "Iron Hens" }), false);
});

test("does read the request bodies when they carry just the one field each", () => {
  assert.equal(isTeamPickRequest({ teamName: "Iron Hens" }), true);
  assert.equal(isTeamPickRequest({ teamName: "" }), false);
  assert.equal(isAdminTeamSeatRequest({ teamName: null }), true);
  assert.equal(isAdminTeamSeatRequest({ teamName: "Iron Hens" }), true);
  assert.equal(isAdminTeamSeatRequest({}), false);
  assert.equal(isAdminPicksRequest({ closed: true }), true);
  assert.equal(isAdminPicksRequest({ closed: "yes" }), false);
});

test("does round the seat cap up when guests do not divide by teams, and give no seats to no teams", () => {
  assert.equal(resolveTeamSeatCap(10, 4), 3);
  assert.equal(resolveTeamSeatCap(8, 4), 2);
  assert.equal(resolveTeamSeatCap(0, 4), 0);
  assert.equal(resolveTeamSeatCap(5, 0), 0);
});

test("does theme a portal team as an empty roster team keeping only an authored genre and colour", () => {
  assert.deepEqual(resolveThemeTeam({ id: "team-1", name: "Iron Hens", genre: "Metal", color: "teamB", members: [] }), {
    id: "team-1",
    name: "Iron Hens",
    playerIds: [],
    totalScore: 0,
    genre: "Metal",
    color: "teamB"
  });
  assert.deepEqual(resolveThemeTeam({ id: "team-2", name: "Plain", members: [] }), {
    id: "team-2",
    name: "Plain",
    playerIds: [],
    totalScore: 0
  });
});
