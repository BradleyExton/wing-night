import assert from "node:assert/strict";
import test from "node:test";

import {
  SPECTATOR_BET_STATUSES,
  isSpectatorBetPick,
  projectSpectatorBets,
  resolveBestBettorPlayerIds,
  resolveSpectatorBetLine,
  resolveSpectatorBetOutcome,
  resolveSpectatorBetWinnerIds,
  type SpectatorBets
} from "./index.js";

const PLAYERS = [
  { id: "p1", name: "Alex" },
  { id: "p2", name: "Caitlin" },
  { id: "p3", name: "Dan" },
  { id: "p4", name: "Rosie" }
];

const openBets = (overrides: Partial<SpectatorBets> = {}): SpectatorBets => ({
  turnKey: "1:0",
  teamId: "team-1",
  line: 7.5,
  baselinePoints: 0,
  status: SPECTATOR_BET_STATUSES.OPEN,
  betsByPlayerId: { p2: "over", p3: "under" },
  bettorPlayerIds: ["p2", "p3"],
  betCount: 2,
  turnPoints: null,
  outcome: null,
  ...overrides
});

test("does put the line on the half-point at or above half the cap when the cap is set", () => {
  assert.equal(resolveSpectatorBetLine(15), 7.5);
  assert.equal(resolveSpectatorBetLine(20), 10.5);
  assert.equal(resolveSpectatorBetLine(1), 0.5);
});

test("does offer no line when the cap is zero or missing", () => {
  assert.equal(resolveSpectatorBetLine(0), null);
  assert.equal(resolveSpectatorBetLine(null), null);
  assert.equal(resolveSpectatorBetLine(-3), null);
});

test("does settle over, under or push when the turn's score lands above, below or on the line", () => {
  assert.equal(resolveSpectatorBetOutcome(8, 7.5), "over");
  assert.equal(resolveSpectatorBetOutcome(7, 7.5), "under");
  assert.equal(resolveSpectatorBetOutcome(7.5, 7.5), "push");
});

test("does accept a pick only when it is over or under", () => {
  assert.equal(isSpectatorBetPick("over"), true);
  assert.equal(isSpectatorBetPick("under"), true);
  assert.equal(isSpectatorBetPick("OVER"), false);
  assert.equal(isSpectatorBetPick(null), false);
});

test("does hide every pick and the bettors from the room when the window is open", () => {
  const projected = projectSpectatorBets(openBets(), { showBettors: false });

  assert.deepEqual(projected?.betsByPlayerId, {});
  assert.deepEqual(projected?.bettorPlayerIds, []);
  assert.equal(projected?.betCount, 2);
});

test("does show the host who has bet but never a pick when the turn has not settled", () => {
  const projected = projectSpectatorBets(openBets({ status: SPECTATOR_BET_STATUSES.CLOSED }), {
    showBettors: true
  });

  assert.deepEqual(projected?.betsByPlayerId, {});
  assert.deepEqual(projected?.bettorPlayerIds, ["p2", "p3"]);
});

test("does reveal every pick when the turn is settled", () => {
  const settled = openBets({ status: SPECTATOR_BET_STATUSES.SETTLED, turnPoints: 9, outcome: "over" });

  assert.deepEqual(projectSpectatorBets(settled, { showBettors: false })?.betsByPlayerId, {
    p2: "over",
    p3: "under"
  });
});

test("does name who called it in roster order when the turn is settled", () => {
  const settled = openBets({
    status: SPECTATOR_BET_STATUSES.SETTLED,
    betsByPlayerId: { p4: "over", p2: "over", p3: "under" },
    turnPoints: 9,
    outcome: "over"
  });

  assert.deepEqual(resolveSpectatorBetWinnerIds(settled, PLAYERS), ["p2", "p4"]);
  assert.deepEqual(resolveSpectatorBetWinnerIds(openBets(), PLAYERS), []);
});

test("does name the fewer bets played as best bettor when two bettors are level on wins", () => {
  assert.deepEqual(
    resolveBestBettorPlayerIds(
      { p1: { won: 4, played: 8 }, p2: { won: 4, played: 5 }, p3: { won: 3, played: 3 } },
      PLAYERS
    ),
    ["p2"]
  );
});

test("does share the title when wins and bets played are level", () => {
  assert.deepEqual(
    resolveBestBettorPlayerIds({ p3: { won: 2, played: 3 }, p1: { won: 2, played: 3 } }, PLAYERS),
    ["p1", "p3"]
  );
});

test("does name nobody when nobody won a bet or the winner left the roster", () => {
  assert.deepEqual(resolveBestBettorPlayerIds({ p1: { won: 0, played: 4 } }, PLAYERS), []);
  assert.deepEqual(resolveBestBettorPlayerIds({ ghost: { won: 5, played: 5 } }, PLAYERS), []);
});
