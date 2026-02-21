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
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
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

test("renders takeover shell during MINIGAME_INTRO", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.MINIGAME_INTRO, [], {
        activeRoundTeamId: "team-alpha",
        teams: [{ id: "team-alpha", name: "Team Alpha", playerIds: [], totalScore: 0 }]
      })}
    />
  );

  assert.match(html, /data-display-minigame-takeover="intro"/);
  assert.match(html, /TRIVIA is up next\./);
  assert.match(html, /Active Team/);
  assert.match(html, /Team Alpha/);
  assert.doesNotMatch(html, /Standings/);
});

test("renders takeover shell during MINIGAME_PLAY using display-safe prompt fields", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, [], {
        activeRoundTeamId: "team-alpha",
        teams: [{ id: "team-alpha", name: "Team Alpha", playerIds: [], totalScore: 0 }],
        minigameDisplayView: {
          minigame: "TRIVIA",
          minigameApiVersion: 1,
          capabilityFlags: ["recordAttempt"],
          activeTurnTeamId: "team-alpha",
          promptCursor: 0,
          pendingPointsByTeamId: {},
          currentPrompt: {
            id: "prompt-1",
            question: "Which scale measures pepper heat?"
          }
        },
        currentTriviaPrompt: {
          id: "prompt-1",
          question: "Which scale measures pepper heat?",
          answer: "Scoville"
        }
      })}
    />
  );

  assert.match(html, /data-display-minigame-takeover="play"/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
  assert.doesNotMatch(html, /Standings/);
});

test("renders explicit unsupported takeover surface for GEO rounds", () => {
  const html = renderToStaticMarkup(
    <DisplayBoard
      roomState={buildSnapshot(Phase.MINIGAME_INTRO, [], {
        currentRoundConfig: {
          ...gameConfigFixture.rounds[0],
          minigame: "GEO"
        }
      })}
    />
  );

  assert.match(html, /data-display-minigame-id="GEO"/);
  assert.match(html, /GEO is not supported in this build\./);
  assert.doesNotMatch(html, /Standings/);
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
