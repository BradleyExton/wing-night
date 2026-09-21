import assert from "node:assert/strict";
import test from "node:test";
import type { Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveTeamThemeById } from "../../../../utils/resolveTeamTheme";
import { SetupPlayersSurface } from "./index";

// `team-alpha` hashes to `teamG`; its metal kit is `teamD`.
const teamsFixture: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    genre: "metal",
    playerIds: ["player-1"],
    totalScore: 10
  }
];

const renderSurface = (): string => {
  return renderToStaticMarkup(
    <SetupPlayersSurface
      mode="setup"
      players={[
        { id: "player-1", name: "Alex" },
        { id: "player-2", name: "Morgan" }
      ]}
      teams={teamsFixture}
      assignedTeamByPlayerId={new Map()}
      teamThemeByTeamId={resolveTeamThemeById(teamsFixture)}
      assignmentDisabled={false}
      addPlayerDisabled={false}
      onAssignPlayer={(): void => {
        return;
      }}
      onAddPlayer={(): void => {
        return;
      }}
    />
  );
};

test("renders assignment controls during setup", () => {
  const html = renderSurface();

  assert.match(html, /Player Name/);
  assert.match(html, /Add Player/);
  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /Team Alpha/);
});

test("does paint the assignment chip dot its genre colour, not the id hash", () => {
  const html = renderSurface();

  assert.match(html, /bg-teamD/);
  assert.doesNotMatch(html, /bg-teamG/);
});
