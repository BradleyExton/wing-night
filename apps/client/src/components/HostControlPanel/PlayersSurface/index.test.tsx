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
      isMinigameIntroPhase={false}
      isTriviaMinigamePlayPhase={false}
      wingParticipationByPlayerId={{}}
      currentTriviaPrompt={null}
      activeRoundTeamId={null}
      activeRoundTeamName="No team assigned"
      turnProgressLabel={null}
      activeTurnTeamName="No team assigned"
      assignmentDisabled={false}
      participationDisabled
      triviaAttemptDisabled
      onAssignPlayer={(): void => {
        return;
      }}
      onSetWingParticipation={(): void => {
        return;
      }}
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Assign Alex to a team/);
  assert.match(html, /Unassigned/);
  assert.match(html, /Team Alpha/);
});

test("renders trivia host controls during trivia minigame play", () => {
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
      isEatingPhase={false}
      isMinigameIntroPhase={false}
      isTriviaMinigamePlayPhase
      wingParticipationByPlayerId={{}}
      currentTriviaPrompt={{
        id: "prompt-1",
        question: "Which scale measures pepper heat?",
        answer: "Scoville"
      }}
      activeRoundTeamId="team-alpha"
      activeRoundTeamName="Team Alpha"
      turnProgressLabel="Team 1 of 2"
      activeTurnTeamName="Team Alpha"
      assignmentDisabled
      participationDisabled
      triviaAttemptDisabled={false}
      onAssignPlayer={(): void => {
        return;
      }}
      onSetWingParticipation={(): void => {
        return;
      }}
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});
