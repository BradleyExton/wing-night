import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RoomState } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { HostPlaceholder } from "./index";

const buildTriviaRoomState = (isPassAndPlayLocked: boolean): RoomState => {
  return {
    phase: Phase.MINIGAME_PLAY,
    currentRound: 1,
    totalRounds: 2,
    players: [
      { id: "player-1", name: "Alex" },
      { id: "player-2", name: "Jordan" }
    ],
    teams: [
      { id: "team-1", name: "Alpha", playerIds: ["player-1"], totalScore: 0 },
      { id: "team-2", name: "Beta", playerIds: ["player-2"], totalScore: 0 }
    ],
    gameConfig: {
      name: "Fixture",
      rounds: [
        {
          round: 1,
          label: "Round 1",
          sauce: "Frank's",
          pointsPerPlayer: 2,
          minigame: "TRIVIA"
        },
        {
          round: 2,
          label: "Round 2",
          sauce: "Buffalo",
          pointsPerPlayer: 3,
          minigame: "GEO"
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
    },
    triviaPrompts: [{ id: "prompt-1", question: "Closest planet?", answer: "Mercury" }],
    currentRoundConfig: {
      round: 1,
      label: "Round 1",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    turnOrderTeamIds: ["team-1", "team-2"],
    activeTurnTeamId: "team-1",
    currentTriviaPrompt: {
      id: "prompt-1",
      question: "Closest planet?",
      answer: "Mercury"
    },
    triviaPromptCursor: 0,
    isPassAndPlayLocked,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
  };
};

test("renders participant-safe trivia view when pass-and-play is locked", () => {
  const html = renderToStaticMarkup(
    <HostPlaceholder
      roomState={buildTriviaRoomState(true)}
      onTogglePassAndPlayLock={() => {
        // no-op
      }}
    />
  );

  assert.match(html, /Pass-and-Play: Locked/);
  assert.match(html, /Hold to Unlock/);
  assert.doesNotMatch(html, />Correct</);
  assert.doesNotMatch(html, />Incorrect</);
  assert.equal(html.includes("Mercury"), false);
});

test("renders scoring controls when pass-and-play is unlocked", () => {
  const html = renderToStaticMarkup(
    <HostPlaceholder
      roomState={buildTriviaRoomState(false)}
      onRecordTriviaAttempt={() => {
        // no-op
      }}
      onTogglePassAndPlayLock={() => {
        // no-op
      }}
    />
  );

  assert.match(html, /Pass-and-Play: Unlocked/);
  assert.doesNotMatch(html, /Hold to Unlock/);
  assert.match(html, />Correct</);
  assert.match(html, />Incorrect</);
  assert.match(html, /Relock Pass-and-Play/);
  assert.equal(html.includes("Mercury"), true);
});
