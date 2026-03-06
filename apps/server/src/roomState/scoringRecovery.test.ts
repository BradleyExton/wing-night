import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  adjustTeamScore,
  assignPlayerToTeam,
  createTeam,
  dispatchMinigameAction,
  extendRoomTimer,
  getRoomStateSnapshot,
  pauseRoomTimer,
  redoLastScoringMutation,
  reorderTurnOrder,
  resetGameToSetup,
  resetRoomState,
  resumeRoomTimer,
  setPendingMinigamePoints,
  setRoomStateFatalError,
  setRoomStateGameConfig,
  setRoomStatePlayers,
  setRoomStateTeams,
  setWingParticipation,
  skipTurnBoundary
} from "./index.js";
import {
  advanceToEatingPhase,
  advanceToMinigamePlayPhase,
  advanceToRoundResultsPhase,
  gameConfigFixture,
  resolveHostPromptCursor,
  resolveHostPromptId,
  setRoomStateTriviaPrompts,
  setupValidTeamsAndAssignments,
  triviaPromptFixture
} from "./testHarness.js";

const recordTriviaAttempt = (isCorrect: boolean): void => {
  dispatchMinigameAction("TRIVIA", "recordAttempt", { isCorrect });
};

test("applies wing and minigame points on MINIGAME_PLAY -> ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 5 });
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setWingParticipation("player-2", true);
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-2": 3 });
  advanceToRoundResultsPhase(1);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.teams[0].totalScore, 7);
  assert.equal(snapshot.teams[1].totalScore, 5);
});

test("does not double apply round points after leaving ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 4 });
  advanceToRoundResultsPhase(1);
  const scoreAtRoundResults = getRoomStateSnapshot().teams[0].totalScore;

  advanceRoomStatePhase();
  const scoreAfterNextPhase = getRoomStateSnapshot().teams[0].totalScore;

  assert.equal(scoreAtRoundResults, 6);
  assert.equal(scoreAfterNextPhase, 6);
});

test("clears pending round score maps after leaving ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 2 });
  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_INTRO);
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.deepEqual(snapshot.pendingMinigamePointsByTeamId, {});
});

test("applies scores cumulatively across rounds", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceToEatingPhase();
  setWingParticipation("player-1", true);
  advanceToMinigamePlayPhase(1);
  setPendingMinigamePoints({ "team-1": 3 });
  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();

  advanceToEatingPhase(2);
  setWingParticipation("player-1", true);
  advanceToMinigamePlayPhase(2);
  setPendingMinigamePoints({ "team-1": 4 });
  advanceToRoundResultsPhase(2);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.teams[0].totalScore, 12);
});

test("logs score mutation metadata when applying round points", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 6 });

  const originalConsoleWarn = console.warn;
  const logCalls: unknown[][] = [];

  console.warn = ((...args: unknown[]): void => {
    logCalls.push(args);
  }) as typeof console.warn;

  try {
    advanceToRoundResultsPhase(1);
  } finally {
    console.warn = originalConsoleWarn;
  }

  const scoreMutationLog = logCalls.find((args) => args[0] === "server:scoreMutation");

  assert.ok(scoreMutationLog);
  assert.deepEqual(scoreMutationLog[1], {
    teamId: "team-1",
    currentRound: 1,
    wingPoints: 2,
    minigamePoints: 6,
    roundPoints: 8,
    totalScore: 8
  });
});

test("adjustTeamScore applies integer deltas outside SETUP", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.INTRO);

  adjustTeamScore("team-1", 5);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.teams[0].totalScore, 5);

  advanceToRoundResultsPhase(1);
  adjustTeamScore("team-1", -2);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.teams[0].totalScore, 3);
});

test("adjustTeamScore rejects invalid mutations", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  const setupSnapshot = getRoomStateSnapshot();

  adjustTeamScore("team-1", 4);
  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.teams, setupSnapshot.teams);

  advanceRoomStatePhase();
  adjustTeamScore("missing-team", 4);
  adjustTeamScore("team-1", 0);
  adjustTeamScore("team-1", 2.5);
  adjustTeamScore("team-1", -1);
  snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.teams[0].totalScore, 0);
});

test("redoLastScoringMutation undoes the latest wing participation mutation", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.canRedoScoringMutation, true);

  redoLastScoringMutation();
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("redoLastScoringMutation restores scoring fields without rewinding phase or timer", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  advanceRoomStatePhase();

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.timer?.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.canRedoScoringMutation, true);

  redoLastScoringMutation();
  snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.timer?.phase, Phase.MINIGAME_PLAY);
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("redoLastScoringMutation restores trivia runtime prompt and points", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();
  const beforeAttemptSnapshot = getRoomStateSnapshot();
  assert.equal(resolveHostPromptId(beforeAttemptSnapshot), "prompt-1");

  recordTriviaAttempt(true);
  let snapshot = getRoomStateSnapshot();
  assert.equal(resolveHostPromptId(snapshot), "prompt-2");
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.canRedoScoringMutation, true);

  redoLastScoringMutation();
  snapshot = getRoomStateSnapshot();
  assert.equal(resolveHostPromptId(snapshot), "prompt-1");
  assert.equal(resolveHostPromptCursor(snapshot), 0);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], undefined);
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("redoLastScoringMutation undoes manual score override", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  adjustTeamScore("team-1", 6);
  assert.equal(getRoomStateSnapshot().teams[0].totalScore, 6);

  redoLastScoringMutation();
  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.teams[0].totalScore, 0);
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("redo scoring history clears on round change", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  adjustTeamScore("team-1", 3);
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, true);

  advanceRoomStatePhase();
  const roundIntroSnapshot = getRoomStateSnapshot();

  assert.equal(roundIntroSnapshot.phase, Phase.ROUND_INTRO);
  assert.equal(roundIntroSnapshot.currentRound, 1);
  assert.equal(roundIntroSnapshot.canRedoScoringMutation, false);

  redoLastScoringMutation();
  assert.equal(getRoomStateSnapshot().teams[0].totalScore, 3);
});

test("redo scoring history clears on MINIGAME_PLAY -> ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  skipTurnBoundary();
  advanceRoomStatePhase();
  setWingParticipation("player-2", false);
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-2": 2 });
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, true);

  const turnResultsSnapshot = advanceRoomStatePhase();
  assert.equal(turnResultsSnapshot.phase, Phase.TURN_RESULTS);
  const roundResultsSnapshot = advanceRoomStatePhase();

  assert.equal(roundResultsSnapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(roundResultsSnapshot.teams[1].totalScore, 2);
  assert.equal(roundResultsSnapshot.canRedoScoringMutation, false);

  redoLastScoringMutation();
  assert.equal(getRoomStateSnapshot().teams[1].totalScore, 2);
});

test("redo scoring history clears on resetGameToSetup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  adjustTeamScore("team-1", 4);
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, true);

  resetGameToSetup();
  const resetSnapshot = getRoomStateSnapshot();

  assert.equal(resetSnapshot.canRedoScoringMutation, false);
  redoLastScoringMutation();
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, false);
});

test("resetGameToSetup clears transient game state and preserves loaded content from mid-round", () => {
  resetRoomState();
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  setRoomStateTeams([
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToEatingPhase();
  setWingParticipation("player-1", true);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 4 });

  const resetSnapshot = resetGameToSetup();

  assert.equal(resetSnapshot.phase, Phase.SETUP);
  assert.equal(resetSnapshot.currentRound, 0);
  assert.equal(resetSnapshot.currentRoundConfig, null);
  assert.equal(resetSnapshot.totalRounds, gameConfigFixture.rounds.length);
  assert.equal(resetSnapshot.timer, null);
  assert.deepEqual(resetSnapshot.teams, [
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);
  assert.deepEqual(resetSnapshot.players, [
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  assert.deepEqual(resetSnapshot.gameConfig, gameConfigFixture);
  assert.deepEqual(resetSnapshot.turnOrderTeamIds, []);
  assert.equal(resetSnapshot.roundTurnCursor, -1);
  assert.equal(resetSnapshot.activeRoundTeamId, null);
  assert.equal(resetSnapshot.activeTurnTeamId, null);
  assert.deepEqual(resetSnapshot.completedRoundTurnTeamIds, []);
  assert.deepEqual(resetSnapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(resetSnapshot.pendingWingPointsByTeamId, {});
  assert.deepEqual(resetSnapshot.pendingMinigamePointsByTeamId, {});
  assert.equal(resetSnapshot.minigameHostView, null);
  assert.equal(resetSnapshot.minigameDisplayView, null);
  assert.equal(resetSnapshot.fatalError, null);
});

test("resetGameToSetup clears final-results scores while keeping content payloads", () => {
  resetRoomState();
  setRoomStateGameConfig(gameConfigFixture);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  setRoomStateTeams([
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();
  advanceToRoundResultsPhase(2);
  advanceRoomStatePhase();
  const finalSnapshot = getRoomStateSnapshot();
  assert.equal(finalSnapshot.phase, Phase.FINAL_RESULTS);

  const resetSnapshot = resetGameToSetup();

  assert.equal(resetSnapshot.phase, Phase.SETUP);
  assert.equal(resetSnapshot.currentRound, 0);
  assert.deepEqual(resetSnapshot.teams, [
    { id: "team-1", name: "Preset Team One", playerIds: [], totalScore: 0 },
    { id: "team-2", name: "Preset Team Two", playerIds: [], totalScore: 0 }
  ]);
  assert.deepEqual(resetSnapshot.players, finalSnapshot.players);
  assert.deepEqual(resetSnapshot.gameConfig, finalSnapshot.gameConfig);
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
  advanceToMinigamePlayPhase();
  assert.equal(resolveHostPromptId(getRoomStateSnapshot()), "prompt-1");
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

test("setRoomStateFatalError stores fatal snapshot and clears round state", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  const snapshot = setRoomStateFatalError("Invalid game config content.");

  assert.equal(snapshot.phase, Phase.SETUP);
  assert.equal(snapshot.currentRound, 0);
  assert.equal(snapshot.fatalError?.code, "CONTENT_LOAD_FAILED");
  assert.equal(snapshot.fatalError?.message, "Invalid game config content.");
  assert.equal(snapshot.canRedoScoringMutation, false);
  assert.equal(snapshot.teams.length, 0);
  assert.equal(snapshot.timer, null);
});

test("fatal room state blocks host mutations", () => {
  resetRoomState();
  setRoomStateFatalError("Invalid content.");
  const beforeMutation = getRoomStateSnapshot();

  createTeam("Blocked Team");
  assignPlayerToTeam("player-1", "team-1");
  setWingParticipation("player-1", true);
  setPendingMinigamePoints({ "team-1": 3 });
  recordTriviaAttempt(true);
  pauseRoomTimer();
  resumeRoomTimer();
  extendRoomTimer(15);
  advanceRoomStatePhase();
  skipTurnBoundary();
  reorderTurnOrder(["team-1", "team-2"]);
  adjustTeamScore("team-1", 2);
  redoLastScoringMutation();
  resetGameToSetup();

  const afterMutation = getRoomStateSnapshot();

  assert.deepEqual(afterMutation, beforeMutation);
});
