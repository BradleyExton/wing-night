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

const teamNameByTeamId = new Map<string, string>([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

test("renders assignment controls during setup", () => {
  const html = renderToStaticMarkup(
    <PlayersSurface
      players={[...playersFixture]}
      teams={[...teamsFixture]}
      assignedTeamByPlayerId={new Map()}
      teamNameByTeamId={teamNameByTeamId}
      isSetupPhase
      isEatingPhase={false}
      wingParticipationByPlayerId={{}}
      assignmentDisabled={false}
      participationDisabled
      onAssignPlayer={(): void => {
        return;
      }}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /Unassigned/);
  assert.match(html, /Team Alpha/);
});

test("renders participation controls during EATING", () => {
  const html = renderToStaticMarkup(
    <PlayersSurface
      players={[...playersFixture]}
      teams={[...teamsFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={teamNameByTeamId}
      isSetupPhase={false}
      isEatingPhase
      wingParticipationByPlayerId={{ "player-1": true }}
      assignmentDisabled
      participationDisabled={false}
      onAssignPlayer={(): void => {
        return;
      }}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Ate wing/);
  assert.match(html, /Team: Team Alpha/);
});
