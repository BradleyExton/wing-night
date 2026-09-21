import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveTeamThemeById } from "../../../../utils/resolveTeamTheme";
import { EatingPlayersSurface } from "./index";

const playersFixture = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" }
];

const teamNameByTeamId = new Map<string, string>([
  ["team-alpha", "Team Alpha"],
  ["team-beta", "Team Beta"]
]);

// `team-alpha` hashes to `teamG`; its metal kit is `teamD`.
const teamThemeByTeamId = resolveTeamThemeById([
  { id: "team-alpha", name: "Team Alpha", genre: "metal", playerIds: ["player-1"], totalScore: 0 },
  { id: "team-beta", name: "Team Beta", genre: "disco", playerIds: ["player-2"], totalScore: 0 }
]);

test("renders only active-team players during eating", () => {
  const html = renderToStaticMarkup(
    <EatingPlayersSurface
      mode="eating"
      players={[...playersFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={teamNameByTeamId}
      teamThemeByTeamId={teamThemeByTeamId}
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
  assert.match(html, /Mark Alex as ate wing/);
});

test("renders active-team empty state during eating when no players are assigned", () => {
  const html = renderToStaticMarkup(
    <EatingPlayersSurface
      mode="eating"
      players={[...playersFixture]}
      assignedTeamByPlayerId={new Map([
        ["player-1", "team-alpha"],
        ["player-2", "team-beta"]
      ])}
      teamNameByTeamId={teamNameByTeamId}
      teamThemeByTeamId={teamThemeByTeamId}
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

test("does paint the eating row dot its genre colour, not the id hash", () => {
  const html = renderToStaticMarkup(
    <EatingPlayersSurface
      mode="eating"
      players={[...playersFixture]}
      assignedTeamByPlayerId={new Map([["player-1", "team-alpha"]])}
      teamNameByTeamId={teamNameByTeamId}
      teamThemeByTeamId={teamThemeByTeamId}
      wingParticipationByPlayerId={{}}
      activeRoundTeamId="team-alpha"
      activeRoundTeamName="Team Alpha"
      participationDisabled={false}
      onSetWingParticipation={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /bg-teamD/);
  assert.doesNotMatch(html, /bg-teamG/);
});
