import assert from "node:assert/strict";
import test from "node:test";

import {
  Phase,
  TIMER_EXTEND_MAX_SECONDS,
  type GameConfigFile,
  type TriviaPrompt
} from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  createInitialRoomState,
  extendRoomTimer,
  getRoomStateSnapshot,
  pauseRoomTimer,
  redoLastScoringMutation,
  reorderTurnOrder,
  resetRoomState,
  resumeRoomTimer,
  setPendingMinigamePoints,
  setRoomStateGameConfig,
  setRoomStateTriviaPrompts,
  setWingParticipation,
  setRoomStatePlayers,
  skipTurnBoundary
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
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canAdvancePhase: false
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

test("advanceRoomStatePhase starts an EATING timer with endsAt", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 50_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    const eatingState = advanceRoomStatePhase();

    assert.equal(eatingState.phase, Phase.EATING);
    assert.deepEqual(eatingState.timer, {
      phase: Phase.EATING,
      startedAt: 50_000,
      endsAt: 170_000,
      durationMs: 120_000,
      isPaused: false,
      remainingMs: 120_000
    });
  } finally {
    Date.now = originalDateNow;
  }
});

test("advanceRoomStatePhase clears timer when leaving EATING", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.MINIGAME_INTRO);
  assert.equal(nextState.timer, null);
});

test("advanceRoomStatePhase starts minigame timer on MINIGAME_PLAY", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 90_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    const minigamePlayState = advanceRoomStatePhase();

    assert.equal(minigamePlayState.phase, Phase.MINIGAME_PLAY);
    assert.deepEqual(minigamePlayState.timer, {
      phase: Phase.MINIGAME_PLAY,
      startedAt: 90_000,
      endsAt: 120_000,
      durationMs: 30_000,
      isPaused: false,
      remainingMs: 30_000
    });
  } finally {
    Date.now = originalDateNow;
  }
});

test("advanceRoomStatePhase starts an EATING timer on MINIGAME_PLAY -> EATING team transitions", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  const originalDateNow = Date.now;
  Date.now = (): number => 125_000;

  try {
    const nextState = advanceRoomStatePhase();

    assert.equal(nextState.phase, Phase.EATING);
    assert.equal(nextState.activeRoundTeamId, "team-2");
    assert.deepEqual(nextState.timer, {
      phase: Phase.EATING,
      startedAt: 125_000,
      endsAt: 245_000,
      durationMs: 120_000,
      isPaused: false,
      remainingMs: 120_000
    });
  } finally {
    Date.now = originalDateNow;
  }
});

test("pauseRoomTimer pauses EATING timer and captures remaining time", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 100_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
  } finally {
    Date.now = originalDateNow;
  }

  Date.now = (): number => 130_000;

  try {
    const pausedSnapshot = pauseRoomTimer();
    assert.equal(pausedSnapshot.timer?.isPaused, true);
    assert.equal(pausedSnapshot.timer?.remainingMs, 90_000);
  } finally {
    Date.now = originalDateNow;
  }
});

test("resumeRoomTimer resumes paused EATING timer with recomputed endsAt", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 100_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
  } finally {
    Date.now = originalDateNow;
  }

  Date.now = (): number => 130_000;
  pauseRoomTimer();

  Date.now = (): number => 140_000;
  try {
    const resumedSnapshot = resumeRoomTimer();
    assert.equal(resumedSnapshot.timer?.isPaused, false);
    assert.equal(resumedSnapshot.timer?.startedAt, 140_000);
    assert.equal(resumedSnapshot.timer?.endsAt, 230_000);
  } finally {
    Date.now = originalDateNow;
  }
});

test("extendRoomTimer extends EATING timer while running", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 100_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
  } finally {
    Date.now = originalDateNow;
  }

  Date.now = (): number => 110_000;
  try {
    const extendedSnapshot = extendRoomTimer(30);
    assert.equal(extendedSnapshot.timer?.endsAt, 250_000);
    assert.equal(extendedSnapshot.timer?.durationMs, 150_000);
  } finally {
    Date.now = originalDateNow;
  }
});

test("extendRoomTimer ignores non-integer and over-limit extension values", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const originalDateNow = Date.now;
  Date.now = (): number => 100_000;

  try {
    advanceRoomStatePhase();
    advanceRoomStatePhase();
    advanceRoomStatePhase();
  } finally {
    Date.now = originalDateNow;
  }

  Date.now = (): number => 110_000;
  try {
    const beforeSnapshot = getRoomStateSnapshot();
    const oversizedSnapshot = extendRoomTimer(TIMER_EXTEND_MAX_SECONDS + 1);
    const fractionalSnapshot = extendRoomTimer(2.5);

    assert.equal(oversizedSnapshot.timer?.endsAt, beforeSnapshot.timer?.endsAt);
    assert.equal(fractionalSnapshot.timer?.endsAt, beforeSnapshot.timer?.endsAt);
    assert.equal(
      oversizedSnapshot.timer?.durationMs,
      beforeSnapshot.timer?.durationMs
    );
    assert.equal(
      fractionalSnapshot.timer?.durationMs,
      beforeSnapshot.timer?.durationMs
    );
  } finally {
    Date.now = originalDateNow;
  }
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
  assert.equal(finalSnapshot.canAdvancePhase, false);
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

test("getRoomStateSnapshot marks setup as not advanceable when setup is invalid", () => {
  resetRoomState();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.SETUP);
  assert.equal(snapshot.canAdvancePhase, false);
});

test("getRoomStateSnapshot marks setup as advanceable when setup is valid", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.SETUP);
  assert.equal(snapshot.canAdvancePhase, true);
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

test("reorderTurnOrder updates round-intro turn order and active team", () => {
  resetRoomState();
  setupThreeTeamsAndAssignments();
  advanceUntil(Phase.ROUND_INTRO, 1);

  const reorderedSnapshot = reorderTurnOrder(["team-3", "team-1", "team-2"]);

  assert.equal(reorderedSnapshot.phase, Phase.ROUND_INTRO);
  assert.deepEqual(reorderedSnapshot.turnOrderTeamIds, [
    "team-3",
    "team-1",
    "team-2"
  ]);
  assert.equal(reorderedSnapshot.roundTurnCursor, 0);
  assert.equal(reorderedSnapshot.activeRoundTeamId, "team-3");
  assert.deepEqual(reorderedSnapshot.completedRoundTurnTeamIds, []);
});

test("reorderTurnOrder is ignored outside ROUND_INTRO", () => {
  resetRoomState();
  setupThreeTeamsAndAssignments();
  advanceToEatingPhase();
  const beforeMutation = getRoomStateSnapshot();

  reorderTurnOrder(["team-2", "team-1", "team-3"]);

  const afterMutation = getRoomStateSnapshot();

  assert.deepEqual(afterMutation.turnOrderTeamIds, beforeMutation.turnOrderTeamIds);
  assert.equal(afterMutation.activeRoundTeamId, beforeMutation.activeRoundTeamId);
});

test("reorderTurnOrder persists into later rounds and rejects invalid sets", () => {
  resetRoomState();
  setRoomStateGameConfig({
    ...gameConfigFixture,
    rounds: [
      { ...gameConfigFixture.rounds[0] },
      {
        ...gameConfigFixture.rounds[0],
        round: 2,
        label: "Round Two",
        sauce: "Hotter"
      }
    ]
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
  advanceUntil(Phase.ROUND_INTRO, 1);
  reorderTurnOrder(["team-2", "team-3", "team-1"]);
  const orderedSnapshot = getRoomStateSnapshot();

  reorderTurnOrder(["team-2", "team-3"]);
  reorderTurnOrder(["team-2", "team-3", "team-3"]);
  reorderTurnOrder(["team-2", "team-3", "team-4"]);
  const invalidMutationSnapshot = getRoomStateSnapshot();

  assert.deepEqual(invalidMutationSnapshot.turnOrderTeamIds, orderedSnapshot.turnOrderTeamIds);

  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();
  const nextRoundIntroSnapshot = getRoomStateSnapshot();

  assert.equal(nextRoundIntroSnapshot.phase, Phase.ROUND_INTRO);
  assert.deepEqual(nextRoundIntroSnapshot.turnOrderTeamIds, [
    "team-2",
    "team-3",
    "team-1"
  ]);
  assert.equal(nextRoundIntroSnapshot.activeRoundTeamId, "team-2");
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

test("skipTurnBoundary advances to next team EATING from EATING and preserves captured points", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  const skippedSnapshot = skipTurnBoundary();

  assert.equal(skippedSnapshot.phase, Phase.EATING);
  assert.equal(skippedSnapshot.activeRoundTeamId, "team-2");
  assert.equal(skippedSnapshot.roundTurnCursor, 1);
  assert.deepEqual(skippedSnapshot.completedRoundTurnTeamIds, ["team-1"]);
  assert.equal(skippedSnapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(skippedSnapshot.pendingWingPointsByTeamId["team-2"], 0);
  assert.equal(skippedSnapshot.timer?.phase, Phase.EATING);
});

test("skipTurnBoundary advances from MINIGAME_INTRO to next team EATING", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();
  advanceRoomStatePhase();
  const introSnapshot = getRoomStateSnapshot();
  assert.equal(introSnapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(introSnapshot.activeRoundTeamId, "team-1");

  const skippedSnapshot = skipTurnBoundary();

  assert.equal(skippedSnapshot.phase, Phase.EATING);
  assert.equal(skippedSnapshot.activeRoundTeamId, "team-2");
  assert.deepEqual(skippedSnapshot.completedRoundTurnTeamIds, ["team-1"]);
});

test("skipTurnBoundary from last-team MINIGAME_PLAY lands on ROUND_RESULTS without score corruption", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-1": 4 });
  skipTurnBoundary();

  setWingParticipation("player-2", true);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-2": 3 });
  const skippedSnapshot = skipTurnBoundary();

  assert.equal(skippedSnapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(skippedSnapshot.teams[0].totalScore, 6);
  assert.equal(skippedSnapshot.teams[1].totalScore, 5);
  assert.deepEqual(skippedSnapshot.completedRoundTurnTeamIds, ["team-1", "team-2"]);
});

test("skipTurnBoundary is ignored outside turn phases", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceUntil(Phase.ROUND_INTRO, 1);
  const beforeSkip = getRoomStateSnapshot();

  skipTurnBoundary();
  const afterSkip = getRoomStateSnapshot();

  assert.deepEqual(afterSkip, beforeSkip);
});

test("skipTurnBoundary clears redo history when landing on ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  skipTurnBoundary();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-2": 3 });
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, true);

  const roundResultsSnapshot = skipTurnBoundary();

  assert.equal(roundResultsSnapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(roundResultsSnapshot.teams[1].totalScore, 3);
  assert.equal(roundResultsSnapshot.canRedoScoringMutation, false);

  redoLastScoringMutation();
  const afterRedoSnapshot = getRoomStateSnapshot();

  assert.equal(afterRedoSnapshot.phase, Phase.ROUND_RESULTS);
  assert.equal(afterRedoSnapshot.teams[1].totalScore, 3);
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
