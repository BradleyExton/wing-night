import assert from "node:assert/strict";
import test from "node:test";
import type { GameConfigFile, Team } from "@wingnight/shared";

import {
  createQuickPlayDraft,
  cyclePlayerSeat,
  humanizeRuleKey,
  moveGame,
  resolveEditableRuleFields,
  resolveQuickPlayGames,
  resolveQuickPlayTeams,
  seedQueueEntry,
  setEveryonePresent,
  setGameRule,
  setGameTimer,
  setTeamCount,
  shuffleSeats,
  toggleGame,
  togglePlayer
} from "./index";

const roster = ["player-1", "player-2", "player-3", "player-4", "player-5"];

const presetTeams: Team[] = [
  { id: "team-1", name: "Molten Metal", playerIds: [], totalScore: 0 },
  { id: "team-2", name: "Spice Girls", playerIds: [], totalScore: 0 },
  { id: "team-3", name: "Honky Tonk Heat", playerIds: [], totalScore: 0 }
];

const gameConfig: GameConfigFile = {
  name: "Pack",
  rounds: [],
  minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
  minigameRules: {
    schlonic: { runsPerTurn: 3, zoneSeed: 20260919 },
    geo: { promptsPerTurn: 2, scoreBandsKm: [{ maxKm: 50, points: 5 }] },
    recreate: { liveGeneration: true, targetsPerTurn: 1 }
  },
  timers: { eatingSeconds: 120, geoSeconds: 45, drawingSeconds: 60, emojiCharadesSeconds: 90 }
};

test("does seat a ticked player where there is most room and unseat an unticked one", () => {
  let draft = togglePlayer(createQuickPlayDraft(), "player-3", roster);
  draft = togglePlayer(draft, "player-1", roster);
  draft = togglePlayer(draft, "player-5", roster);

  assert.deepEqual(draft.presentPlayerIds, ["player-1", "player-3", "player-5"]);
  assert.deepEqual(draft.seatByPlayerId, { "player-3": 0, "player-1": 1, "player-5": 0 });

  draft = togglePlayer(draft, "player-3", roster);

  assert.deepEqual(draft.presentPlayerIds, ["player-1", "player-5"]);
  assert.deepEqual(draft.seatByPlayerId, { "player-1": 1, "player-5": 0 });
});

test("does deal everyone round-robin and re-deal when the team count changes", () => {
  const everyone = setEveryonePresent(createQuickPlayDraft(), roster);

  assert.deepEqual(everyone.seatByPlayerId, {
    "player-1": 0,
    "player-2": 1,
    "player-3": 0,
    "player-4": 1,
    "player-5": 0
  });

  const threeTeams = setTeamCount(everyone, 3);

  assert.deepEqual(
    resolveQuickPlayTeams(threeTeams, presetTeams).map((team) => team.playerIds),
    [["player-1", "player-4"], ["player-2", "player-5"], ["player-3"]]
  );
});

test("does bump a tapped player to the next team and wrap", () => {
  let draft = setEveryonePresent(createQuickPlayDraft(), roster);
  draft = cyclePlayerSeat(draft, "player-2");

  assert.equal(draft.seatByPlayerId["player-2"], 0);
  assert.equal(cyclePlayerSeat(draft, "player-9"), draft);
});

test("does shuffle with the injected randomness and keep everyone seated", () => {
  const draft = shuffleSeats(setEveryonePresent(createQuickPlayDraft(), roster), () => 0);

  assert.deepEqual(new Set(Object.keys(draft.seatByPlayerId)), new Set(roster));
  assert.deepEqual(
    resolveQuickPlayTeams(draft, presetTeams).map((team) => team.playerIds.length),
    [3, 2]
  );
});

test("does seed a queued game from the pack's rules and clock", () => {
  assert.deepEqual(seedQueueEntry("SCHLONIC", gameConfig), {
    minigame: "SCHLONIC",
    rules: { runsPerTurn: 3, zoneSeed: 20260919 },
    timerSeconds: null
  });
  assert.deepEqual(seedQueueEntry("DRAWING", gameConfig), {
    minigame: "DRAWING",
    rules: null,
    timerSeconds: 60
  });
  assert.deepEqual(seedQueueEntry("TRIVIA", null), {
    minigame: "TRIVIA",
    rules: null,
    timerSeconds: null
  });
});

test("does queue in tap order, reorder, and drop a game tapped again", () => {
  let draft = toggleGame(createQuickPlayDraft(), "GEO", gameConfig);
  draft = toggleGame(draft, "SCHLONIC", gameConfig);
  draft = toggleGame(draft, "DRAWING", gameConfig);

  assert.deepEqual(
    draft.queue.map((entry) => entry.minigame),
    ["GEO", "SCHLONIC", "DRAWING"]
  );

  draft = moveGame(draft, "DRAWING", -1);
  assert.deepEqual(
    draft.queue.map((entry) => entry.minigame),
    ["GEO", "DRAWING", "SCHLONIC"]
  );
  assert.equal(moveGame(draft, "GEO", -1), draft);

  draft = toggleGame(draft, "GEO", gameConfig);
  assert.deepEqual(
    draft.queue.map((entry) => entry.minigame),
    ["DRAWING", "SCHLONIC"]
  );
});

test("does edit a queued game's rules and clock without touching the pack", () => {
  let draft = toggleGame(createQuickPlayDraft(), "SCHLONIC", gameConfig);
  draft = toggleGame(draft, "GEO", gameConfig);
  draft = setGameRule(draft, "SCHLONIC", "runsPerTurn", 1);
  draft = setGameTimer(draft, "GEO", 20);

  assert.deepEqual(resolveQuickPlayGames(draft), [
    { minigame: "SCHLONIC", rules: { runsPerTurn: 1, zoneSeed: 20260919 }, timerSeconds: null },
    {
      minigame: "GEO",
      rules: { promptsPerTurn: 2, scoreBandsKm: [{ maxKm: 50, points: 5 }] },
      timerSeconds: 20
    }
  ]);
  assert.deepEqual(gameConfig.minigameRules?.schlonic, { runsPerTurn: 3, zoneSeed: 20260919 });
});

test("does offer a control only for the scalar rules", () => {
  assert.deepEqual(resolveEditableRuleFields(gameConfig.minigameRules?.geo ?? null), [
    { key: "promptsPerTurn", value: 2 }
  ]);
  assert.deepEqual(resolveEditableRuleFields(gameConfig.minigameRules?.recreate ?? null), [
    { key: "liveGeneration", value: true },
    { key: "targetsPerTurn", value: 1 }
  ]);
  assert.deepEqual(resolveEditableRuleFields(null), []);
});

test("does spell a rule key out", () => {
  assert.equal(humanizeRuleKey("parWingsPerRun"), "Par wings per run");
  assert.equal(humanizeRuleKey("zoneSeed"), "Zone seed");
  assert.equal(humanizeRuleKey("limitSeconds"), "Limit seconds");
});
