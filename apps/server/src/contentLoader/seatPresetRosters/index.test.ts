import assert from "node:assert/strict";
import test from "node:test";

import type { Player, PlayersContentEntry, Team } from "@wingnight/shared";

import { seatPresetRosters } from "./index.js";

const buildTeams = (): Team[] => [
  { id: "team-1", name: "Scorch Squad", playerIds: [], totalScore: 0, genre: "metal" },
  { id: "team-2", name: "Blaze Brigade", playerIds: [], totalScore: 0 }
];

const buildPlayers = (entries: readonly PlayersContentEntry[]): Player[] => {
  return entries.map((entry, index) => ({
    id: `player-${index + 1}`,
    name: entry.name
  }));
};

const seat = (entries: readonly PlayersContentEntry[]): Team[] => {
  return seatPresetRosters({
    playerEntries: entries,
    players: buildPlayers(entries),
    teams: buildTeams()
  });
};

test("seats each player on the team their entry names", () => {
  const teams = seat([
    { name: "Ada", team: "Scorch Squad" },
    { name: "Grace", team: "Blaze Brigade" },
    { name: "Alan", team: "Scorch Squad" }
  ]);

  assert.deepEqual(teams[0]?.playerIds, ["player-1", "player-3"]);
  assert.deepEqual(teams[1]?.playerIds, ["player-2"]);
});

test("leaves every team empty when no entry declares a team", () => {
  const teams = seat([{ name: "Ada" }, { name: "Grace" }]);

  assert.deepEqual(teams[0]?.playerIds, []);
  assert.deepEqual(teams[1]?.playerIds, []);
});

test("leaves a player unassigned when only some entries declare a team", () => {
  const teams = seat([{ name: "Ada", team: "Scorch Squad" }, { name: "Grace" }]);

  assert.deepEqual(teams[0]?.playerIds, ["player-1"]);
  assert.deepEqual(teams[1]?.playerIds, []);
});

// Seat order is players.json order, not entry-declaration order per team, so a
// display refresh and a reset both render the same roster.
test("seats players in players.json order", () => {
  const teams = seat([
    { name: "Ada", team: "Blaze Brigade" },
    { name: "Grace", team: "Blaze Brigade" },
    { name: "Alan", team: "Blaze Brigade" }
  ]);

  assert.deepEqual(teams[1]?.playerIds, ["player-1", "player-2", "player-3"]);
});

test("matches a team name ignoring case and surrounding whitespace", () => {
  const teams = seat([{ name: "Ada", team: "  scorch SQUAD " }]);

  assert.deepEqual(teams[0]?.playerIds, ["player-1"]);
});

test("throws naming the player and the bad team when a team does not exist", () => {
  assert.throws(
    () => seat([{ name: "Ada", team: "Pepper Riot" }]),
    /"Ada" → "Pepper Riot".*Scorch Squad/s
  );
});

test("reports every unmatched assignment in one error", () => {
  assert.throws(
    () =>
      seat([
        { name: "Ada", team: "Pepper Riot" },
        { name: "Grace", team: "Scorch Squad" },
        { name: "Alan", team: "Inferno Crew" }
      ]),
    /"Ada".*"Alan"/s
  );
});

// The input teams must come back untouched: `loadTeams` output is handed
// straight to room state elsewhere, and a mutated argument would seat players
// twice on an apply-then-reload.
test("does not mutate the teams it was given", () => {
  const teams = buildTeams();
  const entries = [{ name: "Ada", team: "Scorch Squad" }];

  seatPresetRosters({ playerEntries: entries, players: buildPlayers(entries), teams });

  assert.deepEqual(teams[0]?.playerIds, []);
});

test("preserves optional team fields while seating", () => {
  const teams = seat([{ name: "Ada", team: "Scorch Squad" }]);

  assert.equal(teams[0]?.genre, "metal");
  assert.equal(teams[0]?.totalScore, 0);
});
