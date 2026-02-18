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
    turnOrderTeamIds: [],
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
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

  assert.match(html, /Trivia Turn/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});
