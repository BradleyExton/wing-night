import assert from "node:assert/strict";
import test from "node:test";

import type { GameConfigFile } from "../content/gameConfig/index.js";
import {
  QUICK_PLAY_SAUCE_LABEL,
  buildQuickPlayGameConfig,
  isQuickPlayStartRequest,
  resolveQuickPlayStartIssues
} from "./index.js";

const baseConfig: GameConfigFile = {
  name: "House Party Pack",
  rounds: [
    { round: 1, label: "Warm Up", sauce: "Frank's", pointsPerPlayer: 2, minigame: "TRIVIA" },
    { round: 2, label: "Second Heat", sauce: "Buffalo", pointsPerPlayer: 3, minigame: "GEO" }
  ],
  minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
  minigameRules: {
    trivia: { questionsPerTurn: 5 },
    schlonic: { runsPerTurn: 3, zoneSeed: 7 }
  },
  timers: { eatingSeconds: 120, geoSeconds: 45, drawingSeconds: 60, emojiCharadesSeconds: 90 }
};

test("does build one round per queued game and keep the pack's scoring", () => {
  const config = buildQuickPlayGameConfig(baseConfig, [
    { minigame: "SCHLONIC" },
    { minigame: "DRAWING" }
  ]);

  assert.deepEqual(
    config.rounds.map((round) => [round.round, round.minigame, round.sauce]),
    [
      [1, "SCHLONIC", QUICK_PLAY_SAUCE_LABEL],
      [2, "DRAWING", QUICK_PLAY_SAUCE_LABEL]
    ]
  );
  assert.deepEqual(config.minigameScoring, baseConfig.minigameScoring);
  assert.equal(config.timers.eatingSeconds, 120);
});

test("does override only the queued game's rules and clock when given", () => {
  const config = buildQuickPlayGameConfig(baseConfig, [
    { minigame: "SCHLONIC", rules: { runsPerTurn: 1 } },
    { minigame: "DRAWING", timerSeconds: 30 },
    { minigame: "GEO", rules: null, timerSeconds: null }
  ]);

  assert.deepEqual(config.minigameRules?.schlonic, { runsPerTurn: 1 });
  assert.deepEqual(config.minigameRules?.trivia, { questionsPerTurn: 5 });
  assert.equal(config.timers.drawingSeconds, 30);
  assert.equal(config.timers.geoSeconds, 45);
  // The pack is not written through.
  assert.deepEqual(baseConfig.minigameRules?.schlonic, { runsPerTurn: 3, zoneSeed: 7 });
});

test("does ignore a clock on a host-paced game", () => {
  const config = buildQuickPlayGameConfig(baseConfig, [
    { minigame: "TRIVIA", timerSeconds: 30 }
  ]);

  assert.deepEqual(config.timers, baseConfig.timers);
});

test("does report every reason a request cannot start", () => {
  assert.deepEqual(resolveQuickPlayStartIssues({ games: [], teams: [] }), [
    "NO_GAMES",
    "TOO_FEW_TEAMS"
  ]);
  assert.deepEqual(
    resolveQuickPlayStartIssues({
      games: [{ minigame: "TRIVIA" }],
      teams: [
        { teamId: "team-1", playerIds: ["player-1"] },
        { teamId: "team-1", playerIds: [] },
        { teamId: "team-2", playerIds: ["player-1"] }
      ]
    }),
    ["DUPLICATE_TEAM", "EMPTY_TEAM", "DUPLICATE_PLAYER"]
  );
  assert.deepEqual(
    resolveQuickPlayStartIssues({
      games: [{ minigame: "TRIVIA" }],
      teams: [
        { teamId: "team-1", playerIds: ["player-1"] },
        { teamId: "team-2", playerIds: ["player-2"] }
      ]
    }),
    []
  );
});

test("does accept only the request shape the launcher sends", () => {
  assert.equal(
    isQuickPlayStartRequest({
      games: [{ minigame: "JOUST", rules: { shotsPerPlayer: 2 }, timerSeconds: null }],
      teams: [{ teamId: "team-1", playerIds: ["player-1"] }]
    }),
    true
  );
  assert.equal(isQuickPlayStartRequest({ games: [{ minigame: "NOPE" }], teams: [] }), false);
  assert.equal(
    isQuickPlayStartRequest({ games: [{ minigame: "GEO", timerSeconds: 0 }], teams: [] }),
    false
  );
  assert.equal(
    isQuickPlayStartRequest({ games: [{ minigame: "GEO", rules: [] }], teams: [] }),
    false
  );
  assert.equal(
    isQuickPlayStartRequest({ games: [], teams: [{ teamId: 1, playerIds: [] }] }),
    false
  );
  assert.equal(isQuickPlayStartRequest(null), false);
});
