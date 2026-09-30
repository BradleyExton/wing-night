import assert from "node:assert/strict";
import test from "node:test";

import { parseTeaserRoster } from "./index";

const rosterFile = {
  players: [
    { id: "player-1", name: "Rob", avatarSrc: "avatars/rob.png" },
    { id: "player-2", name: "Jaz" }
  ],
  teams: [
    { id: "team-1", name: "Molten Metal", genre: "metal", playerIds: ["player-1", "player-2"], totalScore: 0 },
    { id: "team-2", name: "Spice Girls", genre: "pop", playerIds: [], totalScore: 0 }
  ]
};

test("reads the players and seated teams when the file is well formed", () => {
  const roster = parseTeaserRoster(rosterFile);

  assert.deepEqual(roster?.players, rosterFile.players);
  assert.deepEqual(
    roster?.teams.map((team) => [team.id, team.genre, team.playerIds]),
    [["team-1", "metal", ["player-1", "player-2"]]]
  );
});

test("returns null when a player has no name", () => {
  assert.equal(
    parseTeaserRoster({ ...rosterFile, players: [{ id: "player-1" }] }),
    null
  );
});

test("returns null when no team has anyone seated", () => {
  assert.equal(parseTeaserRoster({ players: [], teams: [rosterFile.teams[1]] }), null);
});

test("returns null when the file is not a roster at all", () => {
  assert.equal(parseTeaserRoster("<!doctype html>"), null);
});

test("does keep a team's authored colour when the file carries one", () => {
  const roster = parseTeaserRoster({
    ...rosterFile,
    teams: [{ ...rosterFile.teams[0], color: "teamD" }]
  });

  assert.equal(roster?.teams[0]?.color, "teamD");
});

test("does drop a team colour that is not a house token", () => {
  const roster = parseTeaserRoster({
    ...rosterFile,
    teams: [{ ...rosterFile.teams[0], color: "chartreuse" }]
  });

  assert.equal(roster?.teams[0]?.color, undefined);
});
