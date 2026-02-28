import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Phase,
  type GameConfigFile,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { DisplayBoard } from "./index";

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

const buildSnapshot = (
  phase: Phase,
  teams: Team[] = [],
  overrides: Partial<RoomState> = {}
): RoomState => {
  const snapshot: RoomState = {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [],
    teams,
    gameConfig: gameConfigFixture,
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canRevertPhaseTransition: false,
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayBoard roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /Standings/);
  assert.match(html, /No teams have joined yet/);
});

test("renders fatal content state when snapshot reports content load failure", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.SETUP, [], {
        fatalError: {
          code: "CONTENT_LOAD_FAILED",
          message: "Missing players content file."
        }
      })}
    />
  );

  assert.match(html, /Content Load Error/);
  assert.match(html, /CONTENT_LOAD_FAILED/);
  assert.match(html, /Missing players content file\./);
  assert.doesNotMatch(html, /Standings/);
});

test("renders eating timer view from snapshot config", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /Round Timer/);
  assert.match(html, /02:00/);
});

test("renders standings in descending score order", () => {
  const teams: Team[] = [
    {
      id: "team-alpha",
      name: "Team Alpha",
      playerIds: [],
      totalScore: 8
    },
    {
      id: "team-beta",
      name: "Team Beta",
      playerIds: [],
      totalScore: 12
    }
  ];
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.ROUND_RESULTS, teams)} />
  );

  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
});
