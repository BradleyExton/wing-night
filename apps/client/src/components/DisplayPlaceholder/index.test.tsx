import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type GameConfigFile, type RoomState } from "@wingnight/shared";

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

const buildSnapshot = (phase: Phase): RoomState => {
  return {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [],
    teams: [],
    gameConfig: gameConfigFixture,
    currentRoundConfig: gameConfigFixture.rounds[0],
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {}
  };
};

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayPlaceholder roomState={null} />);

  assert.match(html, /Waiting for room state/);
});

test("renders fallback copy when round intro metadata is unavailable", () => {
  const html = renderToStaticMarkup(
    <DisplayPlaceholder roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /Round details will appear/);
});

test("renders round intro details from currentRoundConfig", () => {
  const html = renderToStaticMarkup(
    <DisplayPlaceholder roomState={buildSnapshot(Phase.ROUND_INTRO)} />
  );

  assert.match(html, /Round 1: Warm Up/);
  assert.match(html, /Sauce:.*Frank&#x27;s/);
  assert.match(html, /Mini-Game:.*TRIVIA/);
});
