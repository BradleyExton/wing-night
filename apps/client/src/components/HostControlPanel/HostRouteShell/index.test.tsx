import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState, type Team } from "@wingnight/shared";

import { HostRouteShell } from "./index";

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
  const snapshot: RoomState = {
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
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: teamsFixture[0]?.id ?? null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("hides override dock trigger in setup phase", () => {
  const html = renderToStaticMarkup(<HostRouteShell roomState={buildSnapshot(Phase.SETUP)} />);

  assert.doesNotMatch(html, /Overrides/);
});

test("renders override dock trigger in gameplay phases", () => {
  const html = renderToStaticMarkup(
    <HostRouteShell roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Overrides/);
  assert.match(html, /open overrides panel/i);
});

test("shows override badge when redo history is available", () => {
  const html = renderToStaticMarkup(
    <HostRouteShell
      roomState={buildSnapshot(Phase.ROUND_RESULTS, {
        canRedoScoringMutation: true
      })}
    />
  );

  assert.match(html, /Needs Review/);
});

test("keeps override dock trigger reachable during minigame takeover", () => {
  const html = renderToStaticMarkup(
    <HostRouteShell roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /data-host-minigame-takeover="intro"/);
  assert.match(html, /Overrides/);
  assert.match(html, /open overrides panel/i);
});
