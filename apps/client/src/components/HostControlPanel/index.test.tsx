import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { HostControlPanel } from "./index";

const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    }
  ],
  minigameScoring: {
    defaultMax: 15,
    finalRoundMax: 20
  },
  timers: {
    eatingSeconds: 120,
    triviaSeconds: 30,
    geoSeconds: 45,
    drawingSeconds: 60
  }
};

const teamsFixture: Team[] = [
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

const buildSnapshot = (
  phase: Phase,
  overrides: Partial<RoomState> = {}
): RoomState => {
  return {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Morgan" }
    ],
    teams: teamsFixture,
    gameConfig: gameConfigFixture,
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: teamsFixture.map((team) => team.id),
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    ...overrides
  };
};

test("renders loading copy when room state is missing", () => {
  const html = renderToStaticMarkup(<HostControlPanel roomState={null} />);

  assert.match(html, /Waiting for room state/);
});

test("renders setup sections and assignment controls during SETUP", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.SETUP)} />
  );

  assert.match(html, /Team Setup/);
  assert.match(html, /Teams/);
  assert.match(html, /Assign Alex to a team/);
  assert.doesNotMatch(html, /Pause Timer/);
  assert.doesNotMatch(html, /Mark each player who finished their wing this round/);
  assert.doesNotMatch(html, /Ate wing/);
});

test("renders eating participation controls and hides setup sections during EATING", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.EATING, {
        timer: {
          phase: Phase.EATING,
          startedAt: 0,
          endsAt: 120_000,
          durationMs: 120_000,
          isPaused: false,
          remainingMs: 120_000
        },
        wingParticipationByPlayerId: { "player-1": true }
      })}
    />
  );

  assert.match(html, /Mark each player who finished their wing this round/);
  assert.match(html, /Timer Controls/);
  assert.match(html, /Pause Timer/);
  assert.match(html, /Ate wing/);
  assert.doesNotMatch(html, /Team Setup/);
  assert.doesNotMatch(html, /Assign Alex to a team/);
});

test("renders trivia controls during TRIVIA MINIGAME_PLAY", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, {
        activeTurnTeamId: "team-alpha",
        currentTriviaPrompt: {
          id: "prompt-1",
          question: "Which scale measures pepper heat?",
          answer: "Scoville"
        }
      })}
    />
  );

  assert.match(html, /Mark the active team&#x27;s answer as correct or incorrect/);
  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("renders compact status cards during INTRO", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Phase Status/);
  assert.match(html, /Round Context/);
  assert.match(html, /Standings Snapshot/);
  assert.match(html, /Next Action/);
  assert.doesNotMatch(html, /Team Setup/);
});

test("renders round context details in compact ROUND_INTRO view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1 of 1/);
  assert.match(html, /Label: Warm Up/);
  assert.match(html, /Sauce: Frank&#x27;s/);
  assert.match(html, /Mini-game: TRIVIA/);
});

test("renders standings snapshot in score-descending order during ROUND_RESULTS", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        teams: [
          {
            id: "team-alpha",
            name: "Team Alpha",
            playerIds: ["player-1"],
            totalScore: 6
          },
          {
            id: "team-beta",
            name: "Team Beta",
            playerIds: ["player-2"],
            totalScore: 14
          }
        ]
      })}
    />
  );

  assert.match(html, /Standings Snapshot/);
  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
});

test("renders completion guidance in compact FINAL_RESULTS view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.FINAL_RESULTS)} />
  );

  assert.match(html, /Game complete\./);
  assert.match(html, /Final Results/);
});

test("keeps MINIGAME_INTRO on detailed host view", () => {
  const html = renderToStaticMarkup(
    <HostControlPanel roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /Team Setup/);
  assert.match(html, /Players/);
  assert.doesNotMatch(html, /Phase Status/);
});
