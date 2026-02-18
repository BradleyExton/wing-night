import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { EatingPlayersSurface } from "./index";

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

test("renders only active-team players during eating", () => {
  const html = renderToStaticMarkup(
    <EatingPlayersSurface
      mode="eating"
      players={[...playersFixture]}
      teams={[...teamsFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={teamNameByTeamId}
      wingParticipationByPlayerId={{ "player-1": true }}
      activeRoundTeamId="team-alpha"
      activeRoundTeamName="Team Alpha"
      participationDisabled={false}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
  assert.match(html, /Ate wing/);
  assert.match(html, /Active Team/);
});

test("renders active-team empty state during eating when no players are assigned", () => {
  const html = renderToStaticMarkup(
    <EatingPlayersSurface
      mode="eating"
      players={[...playersFixture]}
      teams={[...teamsFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={teamNameByTeamId}
      wingParticipationByPlayerId={{}}
      activeRoundTeamId="team-gamma"
      activeRoundTeamName="No team assigned"
      participationDisabled={false}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /No players assigned to the active team\./);
  assert.doesNotMatch(html, /Alex/);
  assert.doesNotMatch(html, /Morgan/);
});
