import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  createInitialRoomState,
  getRoomStateSnapshot,
  resetRoomState,
  setRoomStatePlayers
} from "./index.js";

const setupValidTeamsAndAssignments = (): void => {
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
};

test("createInitialRoomState returns setup defaults", () => {
  assert.deepEqual(createInitialRoomState(), {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: []
  });
});

test("getRoomStateSnapshot returns a safe clone", () => {
  resetRoomState();

  const firstSnapshot = getRoomStateSnapshot();
  firstSnapshot.players.push({ id: "p1", name: "Player One" });

  const secondSnapshot = getRoomStateSnapshot();

  assert.equal(secondSnapshot.players.length, 0);
});

test("advanceRoomStatePhase transitions setup to intro", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.INTRO);
  assert.equal(nextState.currentRound, 0);
});

test("advanceRoomStatePhase sets currentRound to 1 on INTRO -> ROUND_INTRO", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 1);
});

test("advanceRoomStatePhase preserves currentRound after round intro", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.EATING);
  assert.equal(nextState.currentRound, 1);
});

test("advanceRoomStatePhase is idempotent at FINAL_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  for (let step = 0; step < 25; step += 1) {
    advanceRoomStatePhase();
  }

  const finalSnapshot = getRoomStateSnapshot();

  assert.equal(finalSnapshot.phase, Phase.FINAL_RESULTS);
  assert.equal(finalSnapshot.currentRound, 3);
});

test("advanceRoomStatePhase blocks SETUP -> INTRO until setup is valid", () => {
  resetRoomState();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  assignPlayerToTeam("player-1", "team-1");

  const blockedSnapshot = advanceRoomStatePhase();

  assert.equal(blockedSnapshot.phase, Phase.SETUP);
  assert.equal(blockedSnapshot.currentRound, 0);
});

test("advanceRoomStatePhase increments round after ROUND_RESULTS when rounds remain", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 2);
});

test("advanceRoomStatePhase logs transition metadata", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalConsoleWarn = console.warn;
  const logCalls: unknown[][] = [];

  console.warn = ((...args: unknown[]): void => {
    logCalls.push(args);
  }) as typeof console.warn;

  try {
    advanceRoomStatePhase();
  } finally {
    console.warn = originalConsoleWarn;
  }

  const transitionLog = logCalls.find(
    (args) => args[0] === "server:phaseTransition"
  );

  assert.ok(transitionLog);
  assert.deepEqual(transitionLog[1], {
    previousPhase: Phase.SETUP,
    nextPhase: Phase.INTRO,
    currentRound: 0
  });
});

test("setRoomStatePlayers stores a safe clone of player records", () => {
  resetRoomState();

  const nextPlayers = [{ id: "player-1", name: "Player One" }];
  const updatedSnapshot = setRoomStatePlayers(nextPlayers);

  assert.deepEqual(updatedSnapshot.players, nextPlayers);

  nextPlayers[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.players[0].name, "Player One");
});

test("createTeam trims team names and ignores empty values", () => {
  resetRoomState();

  createTeam("  Team Alpha  ");
  createTeam("   ");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.teams.length, 1);
  assert.equal(snapshot.teams[0].id, "team-1");
  assert.equal(snapshot.teams[0].name, "Team Alpha");
  assert.deepEqual(snapshot.teams[0].playerIds, []);
  assert.equal(snapshot.teams[0].totalScore, 0);
});

test("assignPlayerToTeam reassigns a player to only one team at a time", () => {
  resetRoomState();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");

  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-1", "team-2");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
  assert.deepEqual(snapshot.teams[1].playerIds, ["player-1"]);
});

test("assignPlayerToTeam supports unassigning via null teamId", () => {
  resetRoomState();
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-1", null);

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("assignPlayerToTeam ignores unknown players and unknown teams", () => {
  resetRoomState();
  setRoomStatePlayers([{ id: "player-1", name: "Player One" }]);
  createTeam("Team Alpha");

  assignPlayerToTeam("missing-player", "team-1");
  assignPlayerToTeam("player-1", "missing-team");

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0].playerIds, []);
});

test("createTeam is locked after leaving setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  const teamsBeforeCreate = getRoomStateSnapshot().teams.length;

  createTeam("Team Alpha");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.teams.length, teamsBeforeCreate);
});

test("assignPlayerToTeam is locked after leaving setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();

  assignPlayerToTeam("player-1", "team-1");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.deepEqual(snapshot.teams[0].playerIds, ["player-1"]);
});
