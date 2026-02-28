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
  adjustTeamScore,
  assignPlayerToTeam,
  createTeam,
  createInitialRoomState,
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
  setRoomStateMinigameContent,
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

const setRoomStateTriviaPrompts = (prompts: TriviaPrompt[]): void => {
  setRoomStateMinigameContent("TRIVIA", { prompts });
};

const recordTriviaAttempt = (isCorrect: boolean): void => {
  dispatchMinigameAction("TRIVIA", "recordAttempt", { isCorrect });
};

const resolveHostPromptId = (
  snapshot: ReturnType<typeof getRoomStateSnapshot>
): string | null => {
  return snapshot.minigameHostView?.currentPrompt?.id ?? null;
};

const resolveHostPromptCursor = (
  snapshot: ReturnType<typeof getRoomStateSnapshot>
): number | null => {
  return snapshot.minigameHostView?.promptCursor ?? null;
};

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
    currentRoundConfig: null,
    turnOrderTeamIds: [],
    roundTurnCursor: -1,
    completedRoundTurnTeamIds: [],
    activeRoundTeamId: null,
    activeTurnTeamId: null,
    minigameHostView: null,
    minigameDisplayView: null,
    timer: null,
    wingParticipationByPlayerId: {},
    pendingWingPointsByTeamId: {},
    pendingMinigamePointsByTeamId: {},
    fatalError: null,
    canRedoScoringMutation: false,
    canRevertPhaseTransition: false,
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

  assert.equal(nextState.phase, Phase.MINIGAME_INTRO);
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

test("advanceRoomStatePhase replaces eating timer when entering MINIGAME_PLAY", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();

  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  advanceRoomStatePhase();

  const nextState = advanceRoomStatePhase();

  assert.equal(nextState.phase, Phase.MINIGAME_PLAY);
  assert.equal(nextState.timer?.phase, Phase.MINIGAME_PLAY);
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

test("advanceRoomStatePhase moves MINIGAME_PLAY -> MINIGAME_INTRO then starts EATING timer", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  const originalDateNow = Date.now;
  Date.now = (): number => 125_000;

  try {
    const introState = advanceRoomStatePhase();
    assert.equal(introState.phase, Phase.MINIGAME_INTRO);
    assert.equal(introState.activeRoundTeamId, "team-2");
    assert.equal(introState.timer, null);

    const eatingState = advanceRoomStatePhase();
    assert.equal(eatingState.phase, Phase.EATING);
    assert.equal(eatingState.activeRoundTeamId, "team-2");
    assert.deepEqual(eatingState.timer, {
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

test("advanceRoomStatePhase keeps next-team minigame projection when MINIGAME_PLAY -> MINIGAME_INTRO", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();

  const introState = advanceRoomStatePhase();

  assert.equal(introState.phase, Phase.MINIGAME_INTRO);
  assert.equal(introState.activeRoundTeamId, "team-2");
  assert.equal(introState.minigameHostView?.minigame, "TRIVIA");
  assert.notEqual(introState.minigameHostView?.currentPrompt, null);
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
  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
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
  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
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

test("skipTurnBoundary advances to next team MINIGAME_INTRO from EATING and preserves captured points", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  const skippedSnapshot = skipTurnBoundary();

  assert.equal(skippedSnapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(skippedSnapshot.activeRoundTeamId, "team-2");
  assert.equal(skippedSnapshot.roundTurnCursor, 1);
  assert.deepEqual(skippedSnapshot.completedRoundTurnTeamIds, ["team-1"]);
  assert.equal(skippedSnapshot.pendingWingPointsByTeamId["team-1"], 2);
  assert.equal(skippedSnapshot.pendingWingPointsByTeamId["team-2"], 0);
  assert.equal(skippedSnapshot.timer, null);
});

test("skipTurnBoundary advances from MINIGAME_INTRO to next team MINIGAME_INTRO", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  const introSnapshot = getRoomStateSnapshot();
  assert.equal(introSnapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(introSnapshot.activeRoundTeamId, "team-1");

  const skippedSnapshot = skipTurnBoundary();

  assert.equal(skippedSnapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(skippedSnapshot.activeRoundTeamId, "team-2");
  assert.deepEqual(skippedSnapshot.completedRoundTurnTeamIds, ["team-1"]);
});

test("skipTurnBoundary from last-team MINIGAME_PLAY lands on ROUND_RESULTS without score corruption", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  advanceToMinigamePlayPhase();
  setPendingMinigamePoints({ "team-1": 4 });
  skipTurnBoundary();

  advanceToEatingPhase();
  setWingParticipation("player-2", true);
  advanceToMinigamePlayPhase();
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
    persistedSnapshot.minigameHostView?.currentPrompt?.question,
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

test("first EATING after skipping first intro still clears previous-round wing participation", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);

  advanceToRoundResultsPhase(1);
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  skipTurnBoundary();
  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.EATING);
  assert.equal(snapshot.activeRoundTeamId, "team-2");
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
  assert.equal(snapshot.minigameHostView?.attemptsRemaining, 1);
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

  advanceRoomStatePhase();

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.phase, Phase.MINIGAME_PLAY);
  assert.equal(snapshot.currentRoundConfig?.minigame, "GEO");
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(snapshot.minigameHostView?.minigame, "GEO");
  assert.equal(snapshot.minigameHostView?.currentPrompt, null);
  assert.equal(resolveHostPromptCursor(snapshot), 0);
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
  assert.equal(snapshot.minigameHostView?.attemptsRemaining, 2);
  assert.equal(resolveHostPromptId(snapshot), "prompt-2");
  assert.equal(resolveHostPromptCursor(snapshot), 1);

  recordTriviaAttempt(false);
  snapshot = getRoomStateSnapshot();
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 1);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);
  assert.equal(snapshot.activeTurnTeamId, "team-1");
  assert.equal(snapshot.minigameHostView?.attemptsRemaining, 1);
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

  assert.equal(afterSecondAttempt.minigameHostView?.attemptsRemaining, 0);
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
  assert.equal(afterRedo.minigameHostView?.attemptsRemaining, 1);
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

  assert.equal(afterThirdAttempt.minigameHostView?.attemptsRemaining, 0);
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

test("applies wing and minigame points on MINIGAME_PLAY -> ROUND_RESULTS", () => {
  resetRoomState();
  setupValidTeamsAndAssignments();
  advanceToEatingPhase();

  setWingParticipation("player-1", true);
  advanceToMinigamePlayPhase();
  setPendingMinigamePoints({ "team-1": 5 });
  advanceRoomStatePhase();
  advanceRoomStatePhase();
  setWingParticipation("player-2", true);
  advanceToMinigamePlayPhase();
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
  advanceToMinigamePlayPhase();
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
  advanceToMinigamePlayPhase();
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

  advanceToMinigamePlayPhase();
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
  advanceRoomStatePhase();
  setPendingMinigamePoints({ "team-2": 2 });
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, true);

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
  setupValidTeamsAndAssignments();
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
  assert.equal(resetSnapshot.teams.length, 0);
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
  setupValidTeamsAndAssignments();
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
  assert.equal(resetSnapshot.teams.length, 0);
  assert.deepEqual(resetSnapshot.players, finalSnapshot.players);
  assert.deepEqual(resetSnapshot.gameConfig, finalSnapshot.gameConfig);
  setupValidTeamsAndAssignments();
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
