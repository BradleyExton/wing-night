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
    currentRoundConfig: gameConfigFixture.rounds[0],
    turnOrderTeamIds: ["team-1"],
    roundTurnCursor: 0,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: "team-1",
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
};

test("renders round intro metadata", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.ROUND_INTRO)} phaseLabel="Round Intro" />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
});

test("renders setup intro with flow illustrations and minigame icon placeholders", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.SETUP)} phaseLabel="Setup" />
  );

  assert.match(html, /Tonight at a Glance/);
  assert.match(html, /display\/setup\/hero\.svg/);
  assert.match(html, /display\/setup\/texture\.svg/);
  assert.match(html, /Live Setup/);
  assert.match(html, /Pack: Fixture Config/);
  assert.match(html, /1 Round/);
  assert.match(html, /Round Flow/);
  assert.match(html, /Mini-Game Intro/);
  assert.match(html, /display\/setup\/flow-eat-wings\.svg/);
  assert.match(html, /display\/setup\/flow-minigame-play\.svg/);
  assert.match(html, /Round Lineup/);
  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /display\/minigames\/trivia-icon\.svg/);
  assert.match(html, /Frank&#x27;s \| TRIVIA \| 2 pts\/player/);
  assert.match(html, /Ready to Start/);
});

test("renders setup flow in intro-before-eating order", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.SETUP)} phaseLabel="Setup" />
  );

  const introIndex = html.indexOf("Mini-Game Intro");
  const eatingIndex = html.indexOf("Eat Wings");
  const playIndex = html.indexOf("Mini-Game Play");

  assert.ok(introIndex >= 0);
  assert.ok(eatingIndex >= 0);
  assert.ok(playIndex >= 0);
  assert.ok(introIndex < eatingIndex);
  assert.ok(eatingIndex < playIndex);
});

test("limits setup lineup cards and shows hidden round count for dense configs", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.SETUP),
        gameConfig: {
          ...gameConfigFixture,
          rounds: [
            gameConfigFixture.rounds[0],
            {
              ...gameConfigFixture.rounds[0],
              round: 2,
              label: "Hotter"
            },
            {
              ...gameConfigFixture.rounds[0],
              round: 3,
              label: "Spicy"
            },
            {
              ...gameConfigFixture.rounds[0],
              round: 4,
              label: "Inferno"
            }
          ]
        }
      }}
      phaseLabel="Setup"
    />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Round 2: Hotter/);
  assert.match(html, /Round 3: Spicy/);
  assert.doesNotMatch(html, /Round 4: Inferno/);
  assert.match(html, /\+1 more rounds/);
});

test("renders setup fallback when game config is unavailable", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.SETUP),
        gameConfig: null
      }}
      phaseLabel="Setup"
    />
  );

  assert.match(html, /House Rules/);
  assert.match(html, /One team is active at a time during each round\./);
  assert.match(html, /Pack: \.\.\./);
  assert.match(html, /0 Rounds/);
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
        minigameDisplayView: {
          minigame: "TRIVIA",
          activeTurnTeamId: "team-1",
          promptCursor: 0,
          pendingPointsByTeamId: {},
          currentPrompt: {
            id: "prompt-1",
            question: "Which scale measures pepper heat?"
          }
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

test("renders waiting fallback when MINIGAME_PLAY projection is not available yet", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_PLAY)} phaseLabel="Minigame Play" />
  );

  assert.match(html, /Waiting for minigame display state from the server snapshot\./);
});

test("renders GEO unsupported surface in MINIGAME_PLAY without waiting on projected view", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.MINIGAME_PLAY),
        currentRoundConfig: {
          ...gameConfigFixture.rounds[0],
          minigame: "GEO"
        }
      }}
      phaseLabel="Minigame Play"
    />
  );

  assert.match(html, /Mini-Game: GEO/);
  assert.match(html, /GEO display surface is currently a stub/);
  assert.doesNotMatch(
    html,
    /Waiting for minigame display state from the server snapshot/
  );
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

test("renders minigame intro metadata and active team context", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_INTRO)} phaseLabel="Minigame Intro" />
  );

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Up Next: Trivia Sprint/);
  assert.match(html, /Objective/);
  assert.match(html, /How to Play/);
  assert.match(html, /Win Condition/);
  assert.match(html, /Quick Tip/);
  assert.match(html, /display\/minigames\/trivia-icon\.svg/);
});
