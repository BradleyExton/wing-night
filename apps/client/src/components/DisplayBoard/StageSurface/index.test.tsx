import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState } from "@wingnight/shared";

import { StageSurface } from "./index";

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

const buildSnapshot = (phase: Phase): RoomState => {
  return {
    phase,
    currentRound: 1,
    totalRounds: 1,
    players: [],
    teams: [{ id: "team-1", name: "Team One", playerIds: [], totalScore: 0 }],
    gameConfig: gameConfigFixture,
    triviaPrompts: [],
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: ["team-1"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: "team-1",
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
    canRedoScoringMutation: false
  };
};

test("renders round intro metadata", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.ROUND_INTRO)} phaseLabel="Round Intro" />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
});

test("falls back to generic context when ROUND_INTRO is missing round config", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{ ...buildSnapshot(Phase.ROUND_INTRO), currentRoundConfig: null }}
      phaseLabel="Round Intro"
    />
  );

  assert.match(html, /Round Intro in progress/);
  assert.match(html, /Round context will appear on the next phase update\./);
});

test("renders trivia question without answer leakage", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.MINIGAME_PLAY),
        activeTurnTeamId: "team-1",
        currentTriviaPrompt: {
          id: "prompt-1",
          question: "Which scale measures pepper heat?",
          answer: "Scoville"
        }
      }}
      phaseLabel="Minigame Play"
    />
  );

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});

test("renders active team without turn progress during eating", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.EATING)} phaseLabel="Eating" />
  );

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Round Timer/);
});

test("uses running EATING timer snapshot instead of static config seconds", () => {
  const now = Date.now();
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.EATING),
        gameConfig: {
          ...gameConfigFixture,
          timers: {
            ...gameConfigFixture.timers,
            eatingSeconds: 999
          }
        },
        timer: {
          phase: Phase.EATING,
          startedAt: now,
          endsAt: now + 120_000,
          durationMs: 120_000,
          isPaused: false,
          remainingMs: 120_000
        }
      }}
      phaseLabel="Eating"
    />
  );

  assert.match(html, /02:00/);
  assert.doesNotMatch(html, /16:39/);
});

test("uses paused EATING timer snapshot remainingMs and freezes countdown", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.EATING),
        gameConfig: {
          ...gameConfigFixture,
          timers: {
            ...gameConfigFixture.timers,
            eatingSeconds: 999
          }
        },
        timer: {
          phase: Phase.EATING,
          startedAt: 0,
          endsAt: 10_000,
          durationMs: 120_000,
          isPaused: true,
          remainingMs: 45_000
        }
      }}
      phaseLabel="Eating"
    />
  );

  assert.match(html, /00:45/);
  assert.doesNotMatch(html, /16:39/);
});

test("falls back to static config timer when EATING timer snapshot is unavailable", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.EATING),
        gameConfig: {
          ...gameConfigFixture,
          timers: {
            ...gameConfigFixture.timers,
            eatingSeconds: 125
          }
        },
        timer: null
      }}
      phaseLabel="Eating"
    />
  );

  assert.match(html, /02:05/);
});

test("renders active team without turn progress during minigame intro", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_INTRO)} phaseLabel="Minigame Intro" />
  );

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Mini-Game: TRIVIA/);
});
