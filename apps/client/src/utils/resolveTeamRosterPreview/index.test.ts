import assert from "node:assert/strict";
import test from "node:test";
import type { Player, Team } from "@wingnight/shared";

import { resolveTeamRosterPreview } from "./index";

const playersFixture: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" }
];

const playerById = new Map(playersFixture.map((player) => [player.id, player] as const));

const teamFixture: Team = {
  id: "team-alpha",
  name: "Team Alpha",
  playerIds: ["player-1", "player-2", "player-3"],
  totalScore: 12
};

test("returns visible player names and hidden count", () => {
  const rosterPreview = resolveTeamRosterPreview(teamFixture, playerById, 2);

  assert.deepEqual(rosterPreview.visiblePlayerNames, ["Alex", "Morgan"]);
  assert.equal(rosterPreview.hiddenPlayerCount, 1);
});

test("skips missing player references safely", () => {
  const rosterPreview = resolveTeamRosterPreview(
    {
      ...teamFixture,
      playerIds: ["player-1", "missing-player-id"]
    },
    playerById,
    3
  );

  assert.deepEqual(rosterPreview.visiblePlayerNames, ["Alex"]);
  assert.equal(rosterPreview.hiddenPlayerCount, 0);
});
