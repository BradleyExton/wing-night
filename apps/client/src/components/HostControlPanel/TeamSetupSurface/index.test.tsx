import assert from "node:assert/strict";
import test from "node:test";
import type { Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveTeamThemeById } from "../../../utils/resolveTeamTheme";
import { TeamSetupSurface } from "./index";

// `team-1` hashes to `teamB` and `team-2` to `teamC`, neither of which is the
// colour their genre kit hands them — so a dot painted from the id hash and a
// dot painted from the theme are visibly different classes here.
const teamsFixture: Team[] = [
  {
    id: "team-1",
    name: "Preset Team Alpha",
    genre: "metal",
    playerIds: ["player-1"],
    totalScore: 0
  },
  {
    id: "team-2",
    name: "Preset Team Beta",
    genre: "disco",
    playerIds: [],
    totalScore: 0
  }
];

const renderSurface = (teams: Team[]): string => {
  return renderToStaticMarkup(
    <TeamSetupSurface
      nextTeamName=""
      setupMutationsDisabled={false}
      teams={teams}
      teamThemeByTeamId={resolveTeamThemeById(teams)}
      onNextTeamNameChange={(): void => {
        return;
      }}
      onCreateTeamSubmit={(): void => {
        return;
      }}
    />
  );
};

test("renders preset teams while keeping setup controls available", () => {
  const html = renderSurface(teamsFixture);

  assert.match(html, /Teams/);
  assert.match(html, /Create Team/);
  assert.match(html, /Preset Team Alpha/);
  assert.match(html, /Preset Team Beta/);
});

test("does paint each team dot its genre colour when the id hashes elsewhere", () => {
  const html = renderSurface(teamsFixture);

  assert.match(html, /bg-teamD/);
  assert.match(html, /bg-teamB\b/);
  // The id-hash colours, which is what the host used to show while the TV
  // showed the two above.
  assert.doesNotMatch(html, /bg-teamC/);
});
