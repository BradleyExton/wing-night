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
  teams: Team[] = []
): RoomState => {
  return {
    phase,
    currentRound: 1,
    totalRounds: gameConfigFixture.rounds.length,
    players: [],
    teams,
    gameConfig: gameConfigFixture,
    currentRoundConfig: gameConfigFixture.rounds[0],
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
  };
};

test("renders waiting copy when room state is missing", () => {
  const html = renderToStaticMarkup(<DisplayPlaceholder roomState={null} />);

  assert.match(html, /Waiting for room state/);
  assert.match(html, /Standings/);
  assert.match(html, /No teams have joined yet/);
});

test("renders eating timer view from snapshot config", () => {
  const html = renderToStaticMarkup(
    <DisplayPlaceholder roomState={buildSnapshot(Phase.EATING)} />
  );

  assert.match(html, /Round Timer/);
  assert.match(html, /02:00/);
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
