import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type GameConfigFile, type TriviaPrompt } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  createInitialRoomState,
  getRoomStateSnapshot,
  recordTriviaAttempt,
  resetRoomState,
  setPendingMinigamePoints,
  setRoomStateGameConfig,
  setRoomStateTriviaPrompts,
  setWingParticipation,
  setRoomStatePlayers
} from "./index.js";

const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    {
      round: 2,
      label: "Medium",
      sauce: "Buffalo",
      pointsPerPlayer: 3,
      minigame: "GEO"
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

const triviaPromptFixture: TriviaPrompt[] = [
  {
    id: "prompt-1",
    question: "Question 1?",
    answer: "Answer 1"
  },
  {
    id: "prompt-2",
    question: "Question 2?",
    answer: "Answer 2"
  }
];

const setupValidTeamsAndAssignments = (
  gameConfig: GameConfigFile = gameConfigFixture
): void => {
  setRoomStateGameConfig(gameConfig);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
};

const setupThreeTeamsAndAssignments = (): void => {
  setRoomStateGameConfig({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0] }]
  });
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  createTeam("Team Gamma");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
  assignPlayerToTeam("player-3", "team-3");
};

const advanceUntil = (
  targetPhase: Phase,
  targetRound: number,
  maxSteps = 64
): void => {
  for (let step = 0; step < maxSteps; step += 1) {
    const snapshot = getRoomStateSnapshot();

    if (
      snapshot.phase === targetPhase &&
      snapshot.currentRound === targetRound
    ) {
      return;
    }

    advanceRoomStatePhase();
  }

  assert.fail(
    `Unable to reach phase ${targetPhase} in round ${targetRound} within ${maxSteps} steps`
  );
};

const advanceToEatingPhase = (round = 1): void => {
  advanceUntil(Phase.EATING, round);
};

const advanceToMinigamePlayPhase = (round = 1): void => {
  advanceUntil(Phase.MINIGAME_PLAY, round);
};

const advanceToFinalRoundMinigamePlayPhase = (): void => {
  advanceUntil(Phase.MINIGAME_PLAY, 2);
};

const advanceToRoundResultsPhase = (round: number): void => {
  advanceUntil(Phase.ROUND_RESULTS, round);
};

test("createInitialRoomState returns setup defaults", () => {
  assert.deepEqual(createInitialRoomState(), {
    phase: Phase.SETUP,
    currentRound: 0,
    totalRounds: 3,
    players: [],
    teams: [],
    gameConfig: null,
    triviaPrompts: [],
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    currentTriviaPrompt: null,
    triviaPromptCursor: 0,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {}
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
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[0]);
  assert.deepEqual(nextState.turnOrderTeamIds, ["team-1", "team-2"]);
  assert.equal(nextState.roundTurnCursor, 0);
  assert.equal(nextState.activeRoundTeamId, "team-1");
  assert.deepEqual(nextState.completedRoundTurnTeamIds, []);
});

test("advanceRoomStatePhase preserves currentRound after round intro", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.EATING);
  assert.equal(nextState.currentRound, 1);
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[0]);
});

test("advanceRoomStatePhase is idempotent at FINAL_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  for (let step = 0; step < 25; step += 1) {
    advanceRoomStatePhase();
  }

  const finalSnapshot = getRoomStateSnapshot();

  assert.equal(finalSnapshot.phase, Phase.FINAL_RESULTS);
  assert.equal(finalSnapshot.currentRound, 2);
  assert.equal(finalSnapshot.currentRoundConfig, null);
});

test("advanceRoomStatePhase blocks SETUP -> INTRO until setup is valid", () => {
  resetRoomState();
  setRoomStateGameConfig(gameConfigFixture);
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

test("advanceRoomStatePhase blocks SETUP -> INTRO when game config is missing", () => {
  resetRoomState();
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");

  const blockedSnapshot = advanceRoomStatePhase();

  assert.equal(blockedSnapshot.phase, Phase.SETUP);
  assert.equal(blockedSnapshot.currentRound, 0);
  assert.equal(blockedSnapshot.currentRoundConfig, null);
});

test("advanceRoomStatePhase increments round after ROUND_RESULTS when rounds remain", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceUntil(Phase.ROUND_RESULTS, 1);
  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.ROUND_INTRO);
  assert.equal(nextState.currentRound, 2);
  assert.deepEqual(nextState.currentRoundConfig, gameConfigFixture.rounds[1]);
  assert.equal(nextState.roundTurnCursor, 0);
  assert.equal(nextState.activeRoundTeamId, "team-1");
  assert.deepEqual(nextState.completedRoundTurnTeamIds, []);
});

test("advanceRoomStatePhase loops team turns before round results", () => {
  resetRoomState();
  setupThreeTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);

  advanceUntil(Phase.MINIGAME_PLAY, 1);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.activeRoundTeamId, "team-1");
  assert.equal(snapshot.roundTurnCursor, 0);
  assert.deepEqual(snapshot.completedRoundTurnTeamIds, []);

  advanceRoomStatePhase();
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.EATING);
  assert.equal(snapshot.activeRoundTeamId, "team-2");
  assert.equal(snapshot.roundTurnCursor, 1);
  assert.deepEqual(snapshot.completedRoundTurnTeamIds, ["team-1"]);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.activeRoundTeamId, "team-2");

  advanceRoomStatePhase();
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.EATING);
  assert.equal(snapshot.activeRoundTeamId, "team-3");
  assert.equal(snapshot.roundTurnCursor, 2);
  assert.deepEqual(snapshot.completedRoundTurnTeamIds, ["team-1", "team-2"]);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(snapshot.activeRoundTeamId, "team-3");
  assert.equal(snapshot.roundTurnCursor, 2);
  assert.deepEqual(snapshot.completedRoundTurnTeamIds, [
    "team-1",
    "team-2",
    "team-3"
  ]);

  advanceRoomStatePhase();
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.phase, Phase.FINAL_RESULTS);
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

test("setRoomStateTriviaPrompts stores a safe clone of trivia prompts", () => {
  resetRoomState();

  const nextPrompts = structuredClone(triviaPromptFixture);
  const updatedSnapshot = setRoomStateTriviaPrompts(nextPrompts);

  assert.deepEqual(updatedSnapshot.triviaPrompts, triviaPromptFixture);

  nextPrompts[0].question = "Changed Locally";
  const persistedSnapshot = getRoomStateSnapshot();

  assert.equal(persistedSnapshot.triviaPrompts[0]?.question, "Question 1?");
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
  assert.equal(snapshot.currentTriviaPrompt?.id, "prompt-1");
  assert.equal(snapshot.triviaPromptCursor, 0);
  assert.deepEqual(snapshot.pendingMinigamePointsByTeamId, {});
});

test("does not initialize trivia projection for non-trivia minigame rounds", () => {
  resetRoomState();
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0], minigame: "GEO" }]
  });
  advanceToEatingPhase();

  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.currentRoundConfig?.minigame, "GEO");
  assert.equal(snapshot.activeTurnTeamId, null);
  assert.equal(snapshot.currentTriviaPrompt, null);
  assert.equal(snapshot.triviaPromptCursor, 0);
});

test("recordTriviaAttempt applies points for active round team and wraps prompts", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  recordTriviaAttempt(true);

  let snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(snapshot.currentTriviaPrompt?.id, "prompt-2");
  assert.equal(snapshot.triviaPromptCursor, 1);

  recordTriviaAttempt(false);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(snapshot.currentTriviaPrompt?.id, "prompt-1");
  assert.equal(snapshot.triviaPromptCursor, 0);
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
  assert.equal(snapshot.triviaPromptCursor, 0);
  assert.equal(snapshot.currentTriviaPrompt?.id, "prompt-replacement");
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
  assert.equal(snapshot.currentTriviaPrompt, null);

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

test("applies wing and minigame points on MINIGAME_PLAY -> ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 5 });
  advanceRoomStatePhase();
  setWingParticipation("player-2", true);
  advanceRoomStatePhase();
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
