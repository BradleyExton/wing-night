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
    canAdvancePhase: true
  };
};

test("renders round intro hero metadata", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Round 1 of 1/);
  assert.match(html, /Round: Round 1 of 1/);
  assert.match(html, /Round Intro/);
  assert.match(html, /Phase: Round Intro/);
  assert.match(html, /Wing Night logo/);
  assert.match(html, /Sauce is locked\. Mini-game is up next\./);
  assert.match(html, /Frank&#x27;s/);
  assert.match(html, /TRIVIA/);
  assert.match(html, /display\/setup\/flow-round-intro\.png/);
  assert.match(html, /Round intro hero illustration/);
});

test("renders setup flow-first layout without live setup status chips", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.SETUP)} />
  );

  assert.match(html, /Wing Night/);
  assert.match(html, /Mini-Game Intro/);
  assert.match(html, /Eat Wings/);
  assert.match(html, /Mini-Game Play/);
  assert.match(html, /Turn Results/);
  assert.match(html, /display\/setup\/flow-minigame-intro\.png/);
  assert.match(html, /display\/setup\/flow-eat-wings\.png/);
  assert.match(html, /display\/setup\/flow-minigame-play\.png/);
  assert.match(html, /display\/setup\/flow-round-results\.png/);
  assert.doesNotMatch(html, /Tonight at a Glance/);
  assert.doesNotMatch(html, /display\/setup\/hero\.png/);
  assert.doesNotMatch(html, /Pack:/);
  assert.doesNotMatch(html, /Live Setup/);
  assert.doesNotMatch(html, /In Progress/);
  assert.doesNotMatch(html, /Open Slot/);
  assert.doesNotMatch(html, /Round Start/);
  assert.doesNotMatch(html, /Round Results/);
});

test("renders locked setup surface during INTRO", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.INTRO)} />
  );

  assert.match(html, /Wing Night/);
  assert.match(html, /Game Locked In/);
  assert.match(html, /Host is about to start Round 1\./);
  assert.doesNotMatch(html, /Intro in progress/);
  assert.doesNotMatch(html, /Phase details will appear on the next update\./);
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

  assert.match(html, /Round 8: Open Slot/);
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

  assert.match(
    html,
    new RegExp(`Round ${SETUP_PREVIEW_ROUND_SLOTS_MAX}: Open Slot`)
  );
  assert.doesNotMatch(
    html,
    new RegExp(`Round ${SETUP_PREVIEW_ROUND_SLOTS_MAX + 1}: Open Slot`)
  );
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

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});

test("renders waiting fallback when MINIGAME_PLAY projection is not available yet", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_PLAY)} />
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
    <StageSurface roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
  assert.match(html, /Team Up: Team One/);
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

test("renders active team without turn progress during minigame intro", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.MINIGAME_INTRO)} />
  );

  assert.match(html, /Phase: Minigame Intro/);
  assert.match(html, /Round: Round 1 of 1/);
  assert.match(html, /Minigame Intro in progress/);
  assert.match(html, /Mini-Game: TRIVIA/);
  assert.match(html, /Get ready for the next trivia prompt\./);
  assert.match(html, /Waiting for trivia prompt\.\.\./);
  assert.match(html, /Team One/);
  assert.match(html, /Team Up: Team One/);
  assert.doesNotMatch(html, /Team 1 of 1/);
});

test("renders turn-results transition context with active team and turn progress", () => {
  const html = renderToStaticMarkup(
    <StageSurface roomState={buildSnapshot(Phase.TURN_RESULTS)} />
  );

  assert.match(html, /Team Turn Complete/);
  assert.match(html, /Completed Team/);
  assert.match(html, /Team One/);
  assert.match(html, /Turn Progress/);
  assert.match(html, /1\/1 teams complete/);
  assert.match(html, /Next Step/);
  assert.match(html, /Show round results/);
  assert.match(html, /Team Up: Team One/);
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

  assert.match(html, /Round Scores Applied/);
  assert.match(html, /Wing Points/);
  assert.match(html, /\+5 pts/);
  assert.match(html, /Mini-Game Points/);
  assert.match(html, /\+7 pts/);
  assert.match(html, /Round Total/);
  assert.match(html, /\+12 pts/);
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

  assert.match(html, /Final Results/);
  assert.match(html, /Champion/);
  assert.match(html, /Team Two/);
  assert.match(html, /15 pts/);
  assert.match(html, /2 teams competed/);
  assert.doesNotMatch(html, /Team Up:/);
});
