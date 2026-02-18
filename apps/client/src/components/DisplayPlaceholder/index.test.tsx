import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Phase,
  type GameConfigFile,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { DisplayPlaceholder } from "./index";

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
  return {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [],
    teams,
    gameConfig: gameConfigFixture,
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: [],
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

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayPlaceholder roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /Standings/);
  assert.match(html, /No teams have joined yet/);
});

test("renders eating timer view from snapshot timer endsAt", () => {
  const originalDateNow = Date.now;
  Date.now = (): number => 1_000;

  try {
    const html = renderToStaticMarkup(
      <DisplayPlaceholder
        roomState={buildSnapshot(Phase.EATING, [], {
          timer: {
            phase: Phase.EATING,
            startedAt: 1_000,
            endsAt: 121_000,
            durationMs: 120_000,
            isPaused: false,
            remainingMs: 120_000
          }
        })}
      />
    );

    assert.match(html, /Round Timer/);
    assert.match(html, /02:00/);
  } finally {
    Date.now = originalDateNow;
  }
});

test("renders expired eating timer as 00:00", () => {
  const originalDateNow = Date.now;
  Date.now = (): number => 122_000;

  try {
    const html = renderToStaticMarkup(
      <DisplayPlaceholder
        roomState={buildSnapshot(Phase.EATING, [], {
          timer: {
            phase: Phase.EATING,
            startedAt: 1_000,
            endsAt: 121_000,
            durationMs: 120_000
          }
        })}
      />
    );

    assert.match(html, /Round Timer/);
    assert.match(html, /00:00/);
  } finally {
    Date.now = originalDateNow;
  }
});

test("renders round intro details from currentRoundConfig", () => {
  const html = renderToStaticMarkup(
    <DisplayPlaceholder roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Sauce/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /Mini-Game/);
  assert.match(html, /TRIVIA/);
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
    <DisplayPlaceholder roomState={buildSnapshot(Phase.ROUND_RESULTS, teams)} />
  );

  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
});

test("renders trivia turn question and active team during MINIGAME_PLAY", () => {
  const teams: Team[] = [
    {
      id: "team-alpha",
      name: "Team Alpha",
      playerIds: [],
      totalScore: 3
    }
  ];
  const html = renderToStaticMarkup(
    <DisplayPlaceholder
      roomState={buildSnapshot(Phase.MINIGAME_PLAY, teams, {
        activeTurnTeamId: "team-alpha",
        currentTriviaPrompt: {
          id: "prompt-1",
          question: "Which scale measures pepper heat?",
          answer: "Scoville"
        }
      })}
    />
  );

  assert.match(html, /Trivia Turn/);
  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});
