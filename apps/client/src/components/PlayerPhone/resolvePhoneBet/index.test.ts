import assert from "node:assert/strict";
import test from "node:test";

import type { SpectatorBets } from "@wingnight/shared";

import { resolvePhoneBet } from "./index";

const TEAMS = [
  { id: "team-1", name: "Spice Girls", playerIds: ["player-1"], totalScore: 0 },
  { id: "team-2", name: "Molten Metal", playerIds: ["player-2"], totalScore: 0 }
];

const bets = (overrides: Partial<SpectatorBets> = {}): SpectatorBets => ({
  turnKey: "1:0",
  teamId: "team-1",
  line: 7.5,
  baselinePoints: 0,
  status: "open",
  betsByPlayerId: {},
  bettorPlayerIds: [],
  betCount: 1,
  turnPoints: null,
  outcome: null,
  ...overrides
});

test("does offer the bet to a watcher off the playing team when the window is open", () => {
  assert.deepEqual(resolvePhoneBet({ teams: TEAMS, spectatorBets: bets() }, "player-2", null), {
    stage: "open",
    teamId: "team-1",
    line: 7.5,
    pick: null
  });
});

test("does give the playing team's phones no bet card when their team is up", () => {
  assert.equal(resolvePhoneBet({ teams: TEAMS, spectatorBets: bets() }, "player-1", null), null);
});

test("does light the phone's own pick only when it was placed on this turn", () => {
  const room = { teams: TEAMS, spectatorBets: bets({ status: "closed" }) };

  assert.equal(resolvePhoneBet(room, "player-2", { turnKey: "1:0", pick: "under" })?.pick, "under");
  assert.equal(resolvePhoneBet(room, "player-2", { turnKey: "0:1", pick: "under" })?.pick, null);
  assert.equal(resolvePhoneBet(room, "player-2", null)?.stage, "locked");
});

test("does settle from the revealed picks and skip a watcher when they sat the turn out", () => {
  const settled = bets({ status: "settled", betsByPlayerId: { "player-2": "over" }, turnPoints: 9, outcome: "over" });

  assert.deepEqual(resolvePhoneBet({ teams: TEAMS, spectatorBets: settled }, "player-2", null), {
    stage: "settled",
    teamId: "team-1",
    line: 7.5,
    pick: "over",
    turnPoints: 9,
    outcome: "over"
  });
  assert.equal(
    resolvePhoneBet({ teams: [...TEAMS, { id: "team-3", name: "Disco", playerIds: ["player-3"], totalScore: 0 }], spectatorBets: settled }, "player-3", null),
    null
  );
});

test("does show nothing when the turn was skipped and its bets voided", () => {
  assert.equal(resolvePhoneBet({ teams: TEAMS, spectatorBets: bets({ status: "void" }) }, "player-2", null), null);
});
