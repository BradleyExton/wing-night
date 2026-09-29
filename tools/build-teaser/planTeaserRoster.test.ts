import assert from "node:assert/strict";
import { test } from "node:test";

import { planTeaserRoster } from "./planTeaserRoster.ts";

test("seats players on their team by name, case-insensitively, with the server's ids", () => {
  const { roster } = planTeaserRoster(
    [
      { name: "Rob ", team: "molten metal", avatarSrc: "avatars/rob.png" },
      { name: "Jaz", team: "Spice Girls" },
      { name: "Kenny", team: "Molten Metal" }
    ],
    [
      { name: "Molten Metal", genre: "metal" },
      { name: "Spice Girls", genre: "pop" }
    ]
  );

  assert.deepEqual(roster.players, [
    { id: "player-1", name: "Rob", avatarSrc: "avatars/rob.png" },
    { id: "player-2", name: "Jaz" },
    { id: "player-3", name: "Kenny" }
  ]);
  assert.deepEqual(
    roster.teams.map((team) => [team.id, team.name, team.genre, team.playerIds]),
    [
      ["team-1", "Molten Metal", "metal", ["player-1", "player-3"]],
      ["team-2", "Spice Girls", "pop", ["player-2"]]
    ]
  );
});

test("lists only the heads the roster actually wears", () => {
  const { avatarSrcs } = planTeaserRoster(
    [
      { name: "Rob", avatarSrc: "avatars/rob.png" },
      { name: "Jaz", avatarSrc: "  " },
      { name: "Kenny" }
    ],
    []
  );

  assert.deepEqual(avatarSrcs, ["avatars/rob.png"]);
});

test("leaves a player whose team is not declared unseated rather than inventing one", () => {
  const { roster } = planTeaserRoster([{ name: "Rob", team: "Nobody" }], [{ name: "Molten Metal" }]);

  assert.deepEqual(roster.teams[0]?.playerIds, []);
  assert.equal(roster.players.length, 1);
});
