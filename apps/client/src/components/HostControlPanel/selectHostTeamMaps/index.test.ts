import assert from "node:assert/strict";
import test from "node:test";

import { buildRoomState } from "../../../testSupport/roomStateFixtures";
import { selectHostTeamMaps } from "./index";

test("does return empty maps when there is no room state", () => {
  const maps = selectHostTeamMaps(null);

  assert.equal(maps.assignedTeamByPlayerId.size, 0);
  assert.equal(maps.teamNameByTeamId.size, 0);
  assert.equal(maps.teamThemeByTeamId.size, 0);
});

test("does map every seated player, every name and every theme when the room has teams", () => {
  const maps = selectHostTeamMaps(
    buildRoomState({
      teams: [
        { id: "team-1", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0, genre: "metal" },
        { id: "team-2", name: "Team Heat", playerIds: ["player-2", "player-3"], totalScore: 0 }
      ]
    })
  );

  assert.equal(maps.assignedTeamByPlayerId.get("player-3"), "team-2");
  assert.equal(maps.teamNameByTeamId.get("team-1"), "Molten Metal");
  assert.equal(maps.teamThemeByTeamId.get("team-1")?.genre, "metal");
  assert.equal(maps.teamThemeByTeamId.get("team-1")?.colorToken, "teamD");
  assert.equal(maps.teamThemeByTeamId.get("team-2")?.genre, "none");
});
