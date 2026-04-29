import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Phase,
  SETUP_PREVIEW_ROUND_SLOTS_MAX,
  type GameConfigFile,
  type RoomState
} from "@wingnight/shared";

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
  },
  minigameRules: {
    trivia: {
      questionsPerTurn: 1
    }
  }
};

const buildSnapshot = (phase: Phase): RoomState => {
  return {
    phase,
    currentRound: 1,
    totalRounds: 1,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Morgan" }
    ],
    teams: [
      {
        id: "team-1",
        name: "Team One",
        playerIds: ["player-1", "player-2"],
        totalScore: 0
      }
    ],
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
    canAdvancePhase: true
  };
};

test("renders round intro three-beat reveal with metadata", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Coming up/);
  assert.match(html, />01</);
  assert.match(html, /Warm Up/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /followed by/);
  assert.match(html, /TRIVIA/);
  assert.doesNotMatch(html, /Wing Night logo/);
  assert.doesNotMatch(html, /Round: Round 1 of 1/);
  assert.doesNotMatch(html, /Phase: Round Intro/);
});

test("renders Cinematic Inferno setup with rounds preview and waiting indicator", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.SETUP)} />
  );

  assert.match(html, /Wing Night/);
  assert.match(html, /Tonight/);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /Waiting for teams/);
  assert.doesNotMatch(html, /display\/setup\/flow-minigame-intro\.png/);
  assert.doesNotMatch(html, /display\/minigames\/trivia-illustration\.svg/);
  assert.doesNotMatch(html, /Tonight at a Glance/);
  assert.doesNotMatch(html, /Pack:/);
  assert.doesNotMatch(html, /Live Setup/);
});

test("renders waiting Cinematic Inferno setup during INTRO with same chrome", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Wing Night/);
  assert.match(html, /Tonight/);
  assert.match(html, /Waiting for teams/);
  assert.doesNotMatch(html, /Game Locked In/);
  assert.doesNotMatch(html, /Host is ready to launch the round\./);
});

test("keeps rendering the setup surface while round intro is locally counting down", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.ROUND_INTRO)} showSetupPreview />
  );

  assert.match(html, /Wing Night/);
  assert.match(html, /Tonight/);
  assert.match(html, /Waiting for teams/);
  assert.doesNotMatch(html, /Sauce is locked\. Mini-game is up next\./);
});

test("renders setup preview filler cards when setup preview slots are configured", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.SETUP),
        gameConfig: {
          ...gameConfigFixture,
          setupPreviewRoundSlots: 8
        }
      }}
    />
  );

  assert.match(html, /Round 08: Open Slot/);
  assert.match(html, /Choose sauce and mini-game to lock this round\./);
  assert.doesNotMatch(html, /\+7 more rounds/);
});

test("clamps setup preview filler cards to the shared maximum", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.SETUP),
        gameConfig: {
          ...gameConfigFixture,
          setupPreviewRoundSlots: SETUP_PREVIEW_ROUND_SLOTS_MAX + 50
        }
      }}
    />
  );

  const paddedMax = String(SETUP_PREVIEW_ROUND_SLOTS_MAX).padStart(2, "0");
  const paddedOver = String(SETUP_PREVIEW_ROUND_SLOTS_MAX + 1).padStart(2, "0");
  assert.match(html, new RegExp(`Round ${paddedMax}: Open Slot`));
  assert.doesNotMatch(html, new RegExp(`Round ${paddedOver}: Open Slot`));
});

test("falls back to generic context when ROUND_INTRO is missing round config", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{ ...buildSnapshot(Phase.ROUND_INTRO), currentRoundConfig: null }}
    />
  );

  assert.match(html, /Round Intro in progress/);
  assert.match(html, /Phase details will appear on the next update\./);
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
    />
  );

  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});

test("renders trivia waiting state when MINIGAME_PLAY projection is not available yet", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_PLAY)} />
  );

  assert.match(html, /Waiting for trivia prompt/);
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
    />
  );

  assert.match(html, /GEO display surface is currently a stub/);
});

test("renders active team and round meta during eating", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /Team One/);
  assert.match(html, /Round 1/);
  assert.match(html, /Eating ·/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.doesNotMatch(html, /Phase:/);
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
    />
  );

  assert.match(html, /02:05/);
});

test("renders the team-first three-beat reveal during minigame intro", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /on the wings/);
  assert.match(html, /Team One/);
  assert.match(html, /Alex/);
  assert.match(html, /Morgan/);
  assert.match(html, /playing/);
  assert.match(html, /TRIVIA/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
  assert.doesNotMatch(html, /Team Up:/);
  assert.doesNotMatch(html, /Team 1 of 1/);
});

test("renders turn-results transition context with active team and turn progress", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.TURN_RESULTS)} />
  );

  assert.match(html, /Turn Complete/);
  assert.match(html, /Team One/);
  assert.match(html, /Round wrap/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
});

test("renders round-results points summary from pending score buckets", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.ROUND_RESULTS),
        pendingWingPointsByTeamId: {
          "team-1": 5
        },
        pendingMinigamePointsByTeamId: {
          "team-1": 7
        }
      }}
    />
  );

  assert.match(html, /Scores locked/);
  assert.match(html, />01</);
  assert.match(html, /Done/);
  assert.match(html, /Team One/);
  assert.match(html, />\+5</);
  assert.match(html, />\+7</);
  assert.match(html, />\+12</);
});

test("renders final-results winner callout from standings order", () => {
  const html = renderToStaticMarkup(
    <StageSurface
      roomState={{
        ...buildSnapshot(Phase.FINAL_RESULTS),
        teams: [
          { id: "team-1", name: "Team One", playerIds: [], totalScore: 9 },
          { id: "team-2", name: "Team Two", playerIds: [], totalScore: 15 }
        ]
      }}
    />
  );

  assert.match(html, /Game Over/);
  assert.match(html, /Champion/);
  assert.match(html, /Team Two/);
  assert.match(html, />15</);
  assert.match(html, /pts/);
  assert.doesNotMatch(html, /Phase:/);
  assert.doesNotMatch(html, /Round:/);
});
