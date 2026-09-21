import assert from "node:assert/strict";
import test from "node:test";
import type { Player, Team } from "@wingnight/shared";

import { resolveTeamThemeById } from "../../../../../../utils/resolveTeamTheme";
import { resolveParadeGroups, resolveParadePairs, UNSEATED_GROUP_ID } from "./index";

const players: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jo" }
];

const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["player-1", "player-4"], totalScore: 0, genre: "metal" },
  { id: "team-empty", name: "Nobody", playerIds: [], totalScore: 0 },
  { id: "team-beta", name: "Team Beta", playerIds: ["player-2", "ghost"], totalScore: 0 }
];

test("does group a team's rostered players in the team's look and skip a team with nobody seated", () => {
  const groups = resolveParadeGroups(players, teams, resolveTeamThemeById(teams));

  assert.deepEqual(
    groups.map((group) => [group.id, group.players.map((player) => player.name)]),
    [
      ["team-alpha", ["Alex", "Jo"]],
      ["team-beta", ["Morgan"]],
      [UNSEATED_GROUP_ID, ["Sam"]]
    ]
  );
  assert.equal(groups[0]?.apparel, undefined);
  assert.equal(groups[0]?.silhouette, "spiky");
  assert.equal(groups[0]?.fillClassName, "text-teamD");
  assert.equal(groups[2]?.fillClassName, null);
});

test("does leave the unseated group out when everyone has a seat", () => {
  const seatedOnly = players.filter((player) => player.id !== "player-3");
  const groups = resolveParadeGroups(seatedOnly, teams, resolveTeamThemeById(teams));

  assert.ok(groups.every((group) => group.id !== UNSEATED_GROUP_ID));
});

test("does pair consecutive groups left and right and leave an odd last group alone", () => {
  const groups = resolveParadeGroups(players, teams, resolveTeamThemeById(teams));
  const pairs = resolveParadePairs(groups);

  assert.equal(pairs.length, 2);
  assert.deepEqual(pairs[0]?.map((group) => group.id), ["team-alpha", "team-beta"]);
  assert.deepEqual(pairs[1]?.map((group) => group.id), [UNSEATED_GROUP_ID]);
});

test("does make no pairs from no groups", () => {
  assert.deepEqual(resolveParadePairs([]), []);
});
