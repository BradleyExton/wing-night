import assert from "node:assert/strict";
import test from "node:test";
import { Phase, toDisplayRoomStateSnapshot } from "@wingnight/shared";

import { buildRoomState } from "../../../../testSupport/roomStateFixtures";
import { resolveStageViewModel } from "./index";

const teams = [
  { id: "team-1", name: "Molten Metal", playerIds: ["player-1"], totalScore: 0, genre: "metal" },
  { id: "team-2", name: "Disco Inferno", playerIds: ["player-2"], totalScore: 0, genre: "disco" }
];

test("does carry a theme for every team and pull out the active team's when a turn is on", () => {
  const viewModel = resolveStageViewModel(
    toDisplayRoomStateSnapshot(
      buildRoomState({
        phase: Phase.MINIGAME_INTRO,
        teams,
        turnOrderTeamIds: ["team-1", "team-2"],
        activeRoundTeamId: "team-2"
      })
    )
  );

  assert.equal(viewModel.teamThemeByTeamId.size, 2);
  assert.equal(viewModel.teamThemeByTeamId.get("team-1")?.wordmark, "chrome");
  assert.equal(viewModel.activeTeamTheme?.genre, "disco");
  assert.equal(viewModel.activeTeamTheme?.colorToken, "teamB");
});

test("does leave the active theme null when no team is up or there is no room", () => {
  const setup = resolveStageViewModel(
    toDisplayRoomStateSnapshot(buildRoomState({ phase: Phase.SETUP, teams, activeRoundTeamId: null }))
  );

  assert.equal(setup.activeTeamTheme, null);
  assert.equal(setup.teamThemeByTeamId.size, 2);

  const empty = resolveStageViewModel(null);

  assert.equal(empty.activeTeamTheme, null);
  assert.equal(empty.teamThemeByTeamId.size, 0);
});
