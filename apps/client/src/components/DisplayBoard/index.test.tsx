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
    canAdvancePhase: true
  };

  return { ...snapshot, ...overrides };
};

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayBoard roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /No teams have joined yet/);
  assert.match(html, /data-display-atmosphere/);
  assert.match(html, /h-\[100dvh\]/);
  assert.match(html, /w-full/);
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
  assert.doesNotMatch(html, /No teams have joined yet/);
});

test("renders eating timer view from snapshot config", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /02:00/);
  assert.match(html, /Eating ·/);
  assert.doesNotMatch(html, /<header/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
});

test("renders a full-screen locked overlay during INTRO", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Locked/);
  assert.match(html, /Host is ready to launch the round\./);
  assert.match(html, /fixed inset-0/);
  assert.match(html, /Wing Night/);
  assert.doesNotMatch(html, /Sauce is locked\. Mini-game is up next\./);
});

test("renders standings in descending score order", () => {
  const teams: Team[] = [
    {
      id: "team-alpha",
      name: "Team Alpha",
      playerIds: ["player-1", "player-2", "player-3"],
      totalScore: 8
    },
    {
      id: "team-beta",
      name: "Team Beta",
      playerIds: ["player-4"],
      totalScore: 12
    }
  ];
  const players = [
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Morgan" },
    { id: "player-3", name: "Sam" },
    { id: "player-4", name: "Jules" }
  ];
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.ROUND_RESULTS, teams, { players })}
    />
  );

  assert.match(html, /Team Beta/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Leading/);
});
