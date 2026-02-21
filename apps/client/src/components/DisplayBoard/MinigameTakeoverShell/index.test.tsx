import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type DisplayRoomStateSnapshot, type GameConfigFile } from "@wingnight/shared";

import { MinigameTakeoverShell } from "./index";

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

const buildSnapshot = (phase: Phase): DisplayRoomStateSnapshot => {
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
    triviaPromptCursor: 0,
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

test("renders minigame intro takeover shell", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      roomState={buildSnapshot(Phase.MINIGAME_INTRO)}
      phaseLabel="Minigame Intro"
    />
  );

  assert.match(html, /data-display-minigame-takeover="intro"/);
  assert.match(html, /TRIVIA is up next\./);
  assert.match(html, /Active Team/);
  assert.match(html, /Team One/);
});

test("renders trivia prompt in minigame play takeover shell", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      roomState={{
        ...buildSnapshot(Phase.MINIGAME_PLAY),
        minigameDisplayView: {
          minigame: "TRIVIA",
          minigameApiVersion: 1,
          capabilityFlags: ["recordAttempt"],
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

  assert.match(html, /data-display-minigame-takeover="play"/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});

test("renders stable fallback when display payload is missing in minigame play", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      roomState={buildSnapshot(Phase.MINIGAME_PLAY)}
      phaseLabel="Minigame Play"
    />
  );

  assert.match(html, /Round context will appear on the next phase update\./);
});

test("renders explicit unsupported takeover for DRAWING", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      roomState={{
        ...buildSnapshot(Phase.MINIGAME_INTRO),
        currentRoundConfig: {
          ...gameConfigFixture.rounds[0],
          minigame: "DRAWING"
        }
      }}
      phaseLabel="Minigame Intro"
    />
  );

  assert.match(html, /data-display-minigame-id="DRAWING"/);
  assert.match(html, /DRAWING is not supported in this build\./);
  assert.match(
    html,
    /A fallback takeover surface is shown while this mini-game is in development\./
  );
});
