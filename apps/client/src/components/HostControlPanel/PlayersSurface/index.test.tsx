import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PlayersSurface } from "./index";

const playersFixture = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" }
];

const teamsFixture = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1"],
    totalScore: 10
  },
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-2"],
    totalScore: 8
  }
];

test("delegates setup mode to setup players surface", () => {
  const html = renderToStaticMarkup(
    <PlayersSurface
      mode="setup"
      players={[...playersFixture]}
      teams={[...teamsFixture]}
      assignedTeamByPlayerId={new Map()}
      assignmentDisabled={false}
      onAssignPlayer={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /Unassigned/);
});

test("delegates eating mode to eating players surface", () => {
  const html = renderToStaticMarkup(
    <PlayersSurface
      mode="eating"
      players={[...playersFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={
        new Map<string, string>([
          ["team-alpha", "Team Alpha"],
          ["team-beta", "Team Beta"]
        ])
      }
      wingParticipationByPlayerId={{ "player-1": true }}
      activeRoundTeamId="team-alpha"
      activeRoundTeamName="Team Alpha"
      participationDisabled={false}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Ate wing/);
  assert.match(html, /Active Team/);
});
