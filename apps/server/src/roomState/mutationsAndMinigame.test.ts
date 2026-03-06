import assert from "node:assert/strict";
import test from "node:test";

import {
  Phase,
  type GameConfigFile
} from "@wingnight/shared";

import {
  addPlayer,
  advanceRoomStatePhase,
  assignPlayerToTeam,
  autoAssignRemainingPlayers,
  createTeam,
  dispatchMinigameAction,
  getRoomStateSnapshot,
  redoLastScoringMutation,
  resetRoomState,
  setPendingMinigamePoints,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStateTeams,
  setRoomStatePlayers,
  setWingParticipation
} from "./index.js";
import {
  advanceToEatingPhase,
  advanceToFinalRoundMinigamePlayPhase,
  advanceToMinigamePlayPhase,
  advanceToRoundResultsPhase,
  advanceUntil,
  gameConfigFixture,
  resolveTriviaHostView,
  resolveHostPromptCursor,
  resolveHostPromptId,
  setRoomStateTriviaPrompts,
  setupValidTeamsAndAssignments,
  triviaPromptFixture
} from "./testHarness.js";

const recordTriviaAttempt = (isCorrect: boolean): void => {
  dispatchMinigameAction("TRIVIA", "recordAttempt", { isCorrect });
};

test("setRoomStatePlayers stores a safe clone of player records", () => {
  resetRoomState();

  const nextPlayers = [{ id: "player-1", name: "Player One" }];
  const updatedSnapshot = setRoomStatePlayers(nextPlayers);

  assert.deepEqual(updatedSnapshot.players, nextPlayers);

  nextPlayers[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.players[0].name, "Player One");
});

test("setRoomStateTeams stores a safe clone of team records", () => {
  resetRoomState();

  const nextTeams = [
    { id: "team-1", name: "Team One", playerIds: ["player-1"], totalScore: 0 }
  ];
  const updatedSnapshot = setRoomStateTeams(nextTeams);

  assert.deepEqual(updatedSnapshot.teams, nextTeams);

  nextTeams[0].name = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.teams[0].name, "Team One");
});

test("setRoomStateGameConfig stores a safe clone and updates totalRounds", () => {
  resetRoomState();

  const nextConfig = structuredClone(gameConfigFixture);
  const updatedSnapshot = setRoomStateGameConfig(nextConfig);

  assert.equal(updatedSnapshot.gameConfig?.name, gameConfigFixture.name);
  assert.equal(updatedSnapshot.totalRounds, 2);
  assert.equal(updatedSnapshot.currentRoundConfig, null);
  assert.deepEqual(updatedSnapshot.pendingMinigamePointsByTeamId, {});

  nextConfig.name = "Changed Locally";
  nextConfig.rounds.push({
    round: 3,
    label: "Hot",
    sauce: "Ghost",
    pointsPerPlayer: 4,
    minigame: "DRAWING"
  });

  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.gameConfig?.name, gameConfigFixture.name);
  assert.equal(persistedSnapshot.totalRounds, 2);
  assert.equal(persistedSnapshot.gameConfig?.rounds.length, 2);
  assert.equal(persistedSnapshot.currentRoundConfig, null);
  assert.deepEqual(persistedSnapshot.pendingMinigamePointsByTeamId, {});
});

test("setRoomStateMinigameContent stores a safe clone of trivia prompts", () => {
  resetRoomState();

  const nextPrompts = structuredClone(triviaPromptFixture);
  setRoomStateMinigameContent("TRIVIA", {
    prompts: nextPrompts
  });

  nextPrompts[0].question = "Changed Locally";
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(resolveHostPromptId(persistedSnapshot), "prompt-1");
  assert.equal(
    resolveTriviaHostView(persistedSnapshot.minigameHostView)?.currentPrompt?.question,
    "Question 1?"
  );
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

test("addPlayer trims names and allocates the next player id", () => {
  resetRoomState();

  setRoomStatePlayers([{ id: "player-2", name: "Existing Player" }]);

  addPlayer("  New Player  ");
  addPlayer("   ");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.players.length, 2);
  assert.deepEqual(snapshot.players[1], {
    id: "player-3",
    name: "New Player"
  });
});

test("addPlayer ignores updates outside setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();

  addPlayer("Late Player");

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.players.some((player) => player.name === "Late Player"), false);
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

test("autoAssignRemainingPlayers balances only unassigned players across teams", () => {
  resetRoomState();

  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" },
    { id: "player-4", name: "Player Four" },
    { id: "player-5", name: "Player Five" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");

  autoAssignRemainingPlayers();

  const snapshot = getRoomStateSnapshot();

  assert.deepEqual(snapshot.teams[0]?.playerIds, ["player-1", "player-3", "player-5"]);
  assert.deepEqual(snapshot.teams[1]?.playerIds, ["player-2", "player-4"]);
});

test("autoAssignRemainingPlayers ignores updates outside setup", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  const beforeAutoAssign = getRoomStateSnapshot();

  autoAssignRemainingPlayers();

  const afterAutoAssign = getRoomStateSnapshot();

  assert.deepEqual(afterAutoAssign.teams, beforeAutoAssign.teams);
});

test("setWingParticipation only accepts active-team players and accumulates by turn", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 0);

  setWingParticipation("player-2", true);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 0);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setWingParticipation("player-2", true);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-2"], 2);
});

test("setWingParticipation recomputes totals when a player is unchecked", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  setWingParticipation("player-1", false);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], false);
  assert.equal(snapshot.pendingWingPointsByTeamId["team-1"], 0);
});

test("setWingParticipation idempotent updates do not replace redo snapshot", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.canRedoScoringMutation, true);

  setWingParticipation("player-1", true);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.wingParticipationByPlayerId["player-1"], true);
  assert.equal(snapshot.canRedoScoringMutation, true);

  redoLastScoringMutation();
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
  assert.equal(snapshot.canRedoScoringMutation, false);
});

test("setWingParticipation ignores invalid mutations", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  setWingParticipation("player-1", true);
  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});

  advanceToEatingPhase();
  setWingParticipation("missing-player", true);
  snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
});

test("setWingParticipation ignores updates for players not assigned to a team", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  const beforeMutation = getRoomStateSnapshot();

  setWingParticipation("player-3", true);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.wingParticipationByPlayerId["player-3"], undefined);
  assert.deepEqual(
    snapshot.pendingWingPointsByTeamId,
    beforeMutation.pendingWingPointsByTeamId
  );
});

test("entering EATING clears wing participation from the previous round", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.EATING);
  assert.deepEqual(snapshot.wingParticipationByPlayerId, {});
  assert.deepEqual(snapshot.pendingWingPointsByTeamId, {});
});

test("initializes trivia turn state through the minigame module boundary", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);

  advanceToMinigamePlayPhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.deepEqual(snapshot.turnOrderTeamIds, ["team-1", "team-2"]);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(resolveTriviaHostView(snapshot.minigameHostView)?.attemptsRemaining, 1);
  assert.equal(resolveHostPromptId(snapshot), "prompt-1");
  assert.equal(resolveHostPromptCursor(snapshot), 0);
  assert.deepEqual(snapshot.pendingMinigamePointsByTeamId, {});
});

test("does not initialize trivia projection for non-trivia minigame rounds", () => {
  resetRoomState();
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0], minigame: "GEO" }]
  });
  advanceToEatingPhase();

  setWingParticipation("player-1", false);
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.currentRoundConfig?.minigame, "GEO");
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(snapshot.minigameHostView?.minigame, "GEO");
  assert.equal(
    "currentPrompt" in (snapshot.minigameHostView ?? {}),
    false
  );
  assert.equal(resolveHostPromptCursor(snapshot), null);
});

test("recordTriviaAttempt applies points for active round team and wraps prompts", () => {
  resetRoomState();
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    minigameRules: {
      trivia: {
        questionsPerTurn: 3
      }
    }
  });
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  recordTriviaAttempt(true);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(resolveTriviaHostView(snapshot.minigameHostView)?.attemptsRemaining, 2);
  assert.equal(resolveHostPromptId(snapshot), "prompt-2");
  assert.equal(resolveHostPromptCursor(snapshot), 1);

  recordTriviaAttempt(false);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(resolveTriviaHostView(snapshot.minigameHostView)?.attemptsRemaining, 1);
  assert.equal(resolveHostPromptId(snapshot), "prompt-1");
  assert.equal(resolveHostPromptCursor(snapshot), 0);
});

test("recordTriviaAttempt defaults to one question per turn when minigameRules are not configured", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  recordTriviaAttempt(true);
  const afterFirstAttempt = getRoomStateSnapshot();
  const promptAfterFirstAttempt = resolveHostPromptId(afterFirstAttempt);
  const pointsAfterFirstAttempt =
    afterFirstAttempt.pendingMinigamePointsByTeamId["team-1"] ?? 0;

  recordTriviaAttempt(true);
  const afterSecondAttempt = getRoomStateSnapshot();

  assert.equal(
    resolveTriviaHostView(afterSecondAttempt.minigameHostView)?.attemptsRemaining,
    0
  );
  assert.equal(resolveHostPromptId(afterSecondAttempt), promptAfterFirstAttempt);
  assert.equal(
    afterSecondAttempt.pendingMinigamePointsByTeamId["team-1"] ?? 0,
    pointsAfterFirstAttempt
  );
});

test("blocked trivia attempts do not mutate runtime projection or redo snapshot", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  recordTriviaAttempt(true);
  const beforeBlockedAttempt = getRoomStateSnapshot();

  recordTriviaAttempt(true);
  const afterBlockedAttempt = getRoomStateSnapshot();

  assert.deepEqual(
    afterBlockedAttempt.pendingMinigamePointsByTeamId,
    beforeBlockedAttempt.pendingMinigamePointsByTeamId
  );
  assert.equal(
    resolveHostPromptId(afterBlockedAttempt),
    resolveHostPromptId(beforeBlockedAttempt)
  );
  assert.equal(
    resolveHostPromptCursor(afterBlockedAttempt),
    resolveHostPromptCursor(beforeBlockedAttempt)
  );
  assert.deepEqual(
    afterBlockedAttempt.minigameHostView,
    beforeBlockedAttempt.minigameHostView
  );
  assert.equal(
    afterBlockedAttempt.canRedoScoringMutation,
    beforeBlockedAttempt.canRedoScoringMutation
  );

  redoLastScoringMutation();
  const afterRedo = getRoomStateSnapshot();

  assert.equal(afterRedo.pendingMinigamePointsByTeamId["team-1"] ?? 0, 0);
  assert.equal(resolveHostPromptCursor(afterRedo), 0);
  assert.equal(resolveHostPromptId(afterRedo), "prompt-1");
  assert.equal(resolveTriviaHostView(afterRedo.minigameHostView)?.attemptsRemaining, 1);
});

test("recordTriviaAttempt enforces configured trivia questions-per-turn limits", () => {
  resetRoomState();
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    minigameRules: {
      trivia: {
        questionsPerTurn: 3
      }
    }
  });
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  recordTriviaAttempt(true);
  recordTriviaAttempt(false);
  recordTriviaAttempt(true);
  const afterThirdAttempt = getRoomStateSnapshot();
  const promptAfterThirdAttempt = resolveHostPromptId(afterThirdAttempt);
  const pointsAfterThirdAttempt =
    afterThirdAttempt.pendingMinigamePointsByTeamId["team-1"] ?? 0;

  recordTriviaAttempt(true);
  const afterFourthAttempt = getRoomStateSnapshot();

  assert.equal(resolveTriviaHostView(afterThirdAttempt.minigameHostView)?.attemptsRemaining, 0);
  assert.equal(resolveHostPromptId(afterFourthAttempt), promptAfterThirdAttempt);
  assert.equal(
    afterFourthAttempt.pendingMinigamePointsByTeamId["team-1"] ?? 0,
    pointsAfterThirdAttempt
  );
});

test("setRoomStateTriviaPrompts reprojects trivia state through runtime adapter during play", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();
  recordTriviaAttempt(true);

  setRoomStateTriviaPrompts([
    {
      id: "prompt-replacement",
      question: "Replacement question?",
      answer: "Replacement answer"
    }
  ]);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(resolveHostPromptCursor(snapshot), 0);
  assert.equal(resolveHostPromptId(snapshot), "prompt-replacement");
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
});

test("trivia turn order remains fixed across rounds", () => {
  resetRoomState();
  const allTriviaRoundsConfig: GameConfigFile = {
    ...gameConfigFixture,
    rounds: [
      { ...gameConfigFixture.rounds[0], minigame: "TRIVIA" },
      { ...gameConfigFixture.rounds[1], minigame: "TRIVIA" }
    ]
  };
  setupValidTeamsAndAssignments(allTriviaRoundsConfig);
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.turnOrderTeamIds, ["team-1", "team-2"]);

  advanceToRoundResultsPhase(1);
  advanceUntil(Phase.MINIGAME_PLAY, 2);

  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.deepEqual(snapshot.turnOrderTeamIds, ["team-1", "team-2"]);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
});

test("recordTriviaAttempt enforces minigame scoring cap", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();
  setPendingMinigamePoints({ "team-1": 15 });

  recordTriviaAttempt(true);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);
});

test("recordTriviaAttempt ignores calls outside TRIVIA MINIGAME_PLAY", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);

  const setupSnapshot = getRoomStateSnapshot();
  recordTriviaAttempt(true);
  let snapshot = getRoomStateSnapshot();
  assert.deepEqual(snapshot.pendingMinigamePointsByTeamId, setupSnapshot.pendingMinigamePointsByTeamId);
  assert.equal(snapshot.activeTurnTeamId, null);
  assert.equal(snapshot.minigameHostView, null);

  advanceToEatingPhase();
  recordTriviaAttempt(true);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.EATING);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], undefined);
});

test("setPendingMinigamePoints enforces default-round scoring cap", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 15 });
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);

  setPendingMinigamePoints({ "team-1": 16 });
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);
});

test("setPendingMinigamePoints is ignored outside MINIGAME_PLAY", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 4 });
  advanceRoomStatePhase();

  const snapshotBeforeInvalidCall = getRoomStateSnapshot();

  setPendingMinigamePoints({ "team-1": 8, "team-2": 8 });
  const snapshotAfterInvalidCall = getRoomStateSnapshot();

  assert.deepEqual(
    snapshotAfterInvalidCall.pendingMinigamePointsByTeamId,
    snapshotBeforeInvalidCall.pendingMinigamePointsByTeamId
  );
});

test("setPendingMinigamePoints rejects negative values", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 4 });
  const snapshotWithValidValues = getRoomStateSnapshot();

  setPendingMinigamePoints({ "team-1": -1 });
  const snapshotAfterInvalidCall = getRoomStateSnapshot();

  assert.deepEqual(
    snapshotAfterInvalidCall.pendingMinigamePointsByTeamId,
    snapshotWithValidValues.pendingMinigamePointsByTeamId
  );
});

test("setPendingMinigamePoints rejects non-finite values", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 3 });
  const snapshotWithValidValues = getRoomStateSnapshot();

  setPendingMinigamePoints({ "team-1": Number.NaN });
  const snapshotAfterInvalidCall = getRoomStateSnapshot();

  assert.deepEqual(
    snapshotAfterInvalidCall.pendingMinigamePointsByTeamId,
    snapshotWithValidValues.pendingMinigamePointsByTeamId
  );
});

test("setPendingMinigamePoints fills missing teams with zero", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 6 });
  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 6);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], 0);
});

test("setPendingMinigamePoints rejects non-active team score mutations", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 4 });
  const snapshotWithValidValues = getRoomStateSnapshot();

  setPendingMinigamePoints({ "team-2": 7 });
  const snapshotAfterInvalidCall = getRoomStateSnapshot();

  assert.deepEqual(
    snapshotAfterInvalidCall.pendingMinigamePointsByTeamId,
    snapshotWithValidValues.pendingMinigamePointsByTeamId
  );
});

test("setPendingMinigamePoints enforces final-round scoring cap", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToFinalRoundMinigamePlayPhase();

  assert.equal(getRoomStateSnapshot().currentRound, 2);

  setPendingMinigamePoints({ "team-1": 20 });
  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 20);

  setPendingMinigamePoints({ "team-1": 21 });
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 20);
});
