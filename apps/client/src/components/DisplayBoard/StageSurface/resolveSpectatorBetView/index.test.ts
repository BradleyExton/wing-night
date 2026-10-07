import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type SpectatorBets } from "@wingnight/shared";

import { resolveSpectatorBetView } from "./index";

const PLAYERS = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Rob" },
  { id: "p3", name: "Dylan" }
];
const TEAMS = [
  { id: "team-1", name: "Spice Girls", playerIds: ["p1"], totalScore: 0 },
  { id: "team-2", name: "Molten Metal", playerIds: ["p2", "p3"], totalScore: 0 }
];

const bets = (overrides: Partial<SpectatorBets> = {}): SpectatorBets => ({
  turnKey: "1:0",
  teamId: "team-1",
  line: 7.5,
  baselinePoints: 0,
  status: "open",
  betsByPlayerId: {},
  bettorPlayerIds: [],
  betCount: 0,
  turnPoints: null,
  outcome: null,
  ...overrides
});

const room = (phase: Phase, spectatorBets: SpectatorBets | null, claimedPlayerIds: string[] = ["p2"]) => ({
  phase,
  players: PLAYERS,
  teams: TEAMS,
  claimedPlayerIds,
  spectatorBets,
  betTallyByPlayerId: {}
});

test("does put the line and the count up on the briefing and the wings when a watcher has a phone", () => {
  assert.deepEqual(resolveSpectatorBetView(room(Phase.MINIGAME_INTRO, bets({ betCount: 2 }))).readout, {
    line: 7.5,
    betCount: 2
  });
  assert.deepEqual(resolveSpectatorBetView(room(Phase.EATING, bets())).readout, { line: 7.5, betCount: 0 });
});

test("does keep the line off the TV when only the playing team has phones and nobody bet", () => {
  assert.equal(resolveSpectatorBetView(room(Phase.MINIGAME_INTRO, bets(), ["p1"])).readout, null);
});

test("does say nothing about bets when the turn is in play", () => {
  const view = resolveSpectatorBetView(room(Phase.MINIGAME_PLAY, bets({ status: "closed", betCount: 3 })));

  assert.deepEqual(view, { readout: null, settlement: null, bestBettor: null });
});

test("does name who called it when the turn's results are up", () => {
  const settled = bets({
    status: "settled",
    betsByPlayerId: { p3: "under", p2: "over" },
    betCount: 2,
    turnPoints: 5,
    outcome: "under"
  });

  assert.deepEqual(resolveSpectatorBetView(room(Phase.TURN_RESULTS, settled)).settlement, {
    line: 7.5,
    turnPoints: 5,
    outcome: "under",
    callerNames: ["Dylan"]
  });
});

test("does name the best bettor and their record when the final results are up", () => {
  const view = resolveSpectatorBetView({
    ...room(Phase.FINAL_RESULTS, null),
    betTallyByPlayerId: { p2: { won: 3, played: 4 }, p3: { won: 2, played: 2 } }
  });

  assert.deepEqual(view.bestBettor, { names: ["Rob"], won: 3, played: 4 });
});
