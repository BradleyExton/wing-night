import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { Phase, SESSION_MODES, type QuickPlayTeam } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  getRoomStateSnapshot,
  resetGameToSetup,
  resetRoomState,
  setRoomStateGameConfig,
  setRoomStatePlayers,
  setRoomStateTeams,
  skipTurnBoundary,
  startQuickPlay
} from "../index.js";
import { gameConfigFixture, setRoomStateTriviaPrompts, triviaPromptFixture } from "../testHarness.js";

// The pack seats four players on two teams; tonight only three turned up and
// the host dealt them the other way round.
const seedPack = (): void => {
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Morgan" },
    { id: "player-3", name: "Jamie" },
    { id: "player-4", name: "Sam" }
  ]);
  setRoomStateTeams([
    { id: "team-1", name: "Molten Metal", playerIds: ["player-1", "player-2"], totalScore: 0, genre: "metal" },
    { id: "team-2", name: "Spice Girls", playerIds: ["player-3", "player-4"], totalScore: 0, genre: "pop" }
  ]);
  setRoomStateTriviaPrompts(triviaPromptFixture);
};

const dealtTeams: QuickPlayTeam[] = [
  { teamId: "team-2", playerIds: ["player-1", "player-3"] },
  { teamId: "team-1", playerIds: ["player-2"] }
];

beforeEach(() => {
  resetRoomState();
  seedPack();
});

test("does open on the first dealt team's briefing with the queue as the rounds", () => {
  const snapshot = startQuickPlay(
    [{ minigame: "TRIVIA", rules: { questionsPerTurn: 2 } }, { minigame: "GEO", timerSeconds: 20 }],
    dealtTeams
  );

  assert.equal(snapshot.sessionMode, SESSION_MODES.QUICK_PLAY);
  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(snapshot.currentRound, 1);
  assert.equal(snapshot.totalRounds, 2);
  assert.equal(snapshot.currentRoundConfig?.minigame, "TRIVIA");
  assert.deepEqual(snapshot.turnOrderTeamIds, ["team-2", "team-1"]);
  assert.equal(snapshot.activeRoundTeamId, "team-2");
  assert.deepEqual(snapshot.gameConfig?.minigameRules?.trivia, { questionsPerTurn: 2 });
  assert.equal(snapshot.gameConfig?.timers.geoSeconds, 20);
  assert.equal(snapshot.gameStartCountdownEndsAt, null);
});

test("does keep the preset team identity and drop the players who are not here", () => {
  const snapshot = startQuickPlay([{ minigame: "TRIVIA" }], dealtTeams);

  assert.deepEqual(
    snapshot.teams.map((team) => [team.id, team.name, team.genre, team.playerIds, team.totalScore]),
    [
      ["team-2", "Spice Girls", "pop", ["player-1", "player-3"], 0],
      ["team-1", "Molten Metal", "metal", ["player-2"], 0]
    ]
  );
  assert.deepEqual(
    snapshot.players.map((player) => player.id),
    ["player-1", "player-2", "player-3"]
  );
});

test("does go from the briefing straight to play, and seat the mini-game turn there", () => {
  startQuickPlay([{ minigame: "TRIVIA" }], dealtTeams);

  const snapshot = advanceRoomStatePhase();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.timer, null);
  assert.equal(snapshot.minigameHostView?.minigame, "TRIVIA");
  assert.equal(snapshot.activeTurnTeamId, "team-2");
});

test("does run every team's turn, then the next queued game, then the final results", () => {
  startQuickPlay([{ minigame: "TRIVIA" }, { minigame: "TRIVIA" }], dealtTeams);

  const phases: Phase[] = [];

  for (let step = 0; step < 12; step += 1) {
    const snapshot = advanceRoomStatePhase();
    phases.push(snapshot.phase);

    if (snapshot.phase === Phase.FINAL_RESULTS) {
      break;
    }
  }

  assert.deepEqual(phases, [
    Phase.MINIGAME_PLAY,
    Phase.TURN_RESULTS,
    Phase.MINIGAME_INTRO,
    Phase.MINIGAME_PLAY,
    Phase.TURN_RESULTS,
    Phase.ROUND_RESULTS,
    Phase.MINIGAME_INTRO,
    Phase.MINIGAME_PLAY,
    Phase.TURN_RESULTS,
    Phase.MINIGAME_INTRO,
    Phase.MINIGAME_PLAY,
    Phase.TURN_RESULTS
  ]);
  assert.equal(getRoomStateSnapshot().currentRound, 2);
  assert.equal(getRoomStateSnapshot().pendingWingPointsByTeamId["team-2"] ?? 0, 0);
});

test("does still let the host skip a team from the briefing", () => {
  startQuickPlay([{ minigame: "TRIVIA" }], dealtTeams);

  const snapshot = skipTurnBoundary();

  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(snapshot.activeRoundTeamId, "team-1");
});

test("does restore the pack's night when the game is reset", () => {
  startQuickPlay([{ minigame: "GEO" }], dealtTeams);

  const snapshot = resetGameToSetup();

  assert.equal(snapshot.sessionMode, SESSION_MODES.NIGHT);
  assert.equal(snapshot.phase, Phase.SETUP);
  assert.equal(snapshot.gameConfig?.name, gameConfigFixture.name);
  assert.equal(snapshot.totalRounds, gameConfigFixture.rounds.length);
  assert.deepEqual(
    snapshot.players.map((player) => player.id),
    ["player-1", "player-2", "player-3", "player-4"]
  );
  assert.deepEqual(
    snapshot.teams.map((team) => [team.id, team.playerIds]),
    [
      ["team-1", ["player-1", "player-2"]],
      ["team-2", ["player-3", "player-4"]]
    ]
  );
});

test("does refuse a request the shared issues reject, an unknown player or team, or bad rules", () => {
  const before = getRoomStateSnapshot();

  assert.deepEqual(startQuickPlay([], dealtTeams), before);
  assert.deepEqual(startQuickPlay([{ minigame: "TRIVIA" }], [dealtTeams[0]!]), before);
  assert.deepEqual(
    startQuickPlay(
      [{ minigame: "TRIVIA" }],
      [
        { teamId: "team-1", playerIds: ["player-9"] },
        { teamId: "team-2", playerIds: ["player-2"] }
      ]
    ),
    before
  );
  assert.deepEqual(
    startQuickPlay(
      [{ minigame: "TRIVIA" }],
      [
        { teamId: "team-9", playerIds: ["player-1"] },
        { teamId: "team-2", playerIds: ["player-2"] }
      ]
    ),
    before
  );
  assert.deepEqual(
    startQuickPlay([{ minigame: "TRIVIA", rules: { questionsPerTurn: 0 } }], dealtTeams),
    before
  );
  assert.equal(getRoomStateSnapshot().phase, Phase.SETUP);
});

test("does refuse to start once the night is under way", () => {
  advanceRoomStatePhase();
  assert.equal(getRoomStateSnapshot().phase, Phase.INTRO);

  const snapshot = startQuickPlay([{ minigame: "TRIVIA" }], dealtTeams);

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.sessionMode, SESSION_MODES.NIGHT);
});
