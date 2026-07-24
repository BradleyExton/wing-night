import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  Phase,
  toDisplayRoomStateSnapshot,
  type GameConfigFile
} from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  dispatchMinigameAction,
  getRoomStateSnapshot,
  redoLastScoringMutation,
  resetRoomState,
  setPendingMinigamePoints,
  setWingParticipation
} from "./index.js";
import {
  advanceToEatingPhase,
  advanceToFinalRoundMinigamePlayPhase,
  advanceToMinigamePlayPhase,
  advanceToRoundResultsPhase,
  advanceUntil,
  gameConfigFixture,
  geoPromptFixture,
  resolveGeoHostView,
  resolveTriviaHostView,
  resolveHostPromptCursor,
  resolveHostPromptId,
  setRoomStateGeoPrompts,
  setRoomStateTriviaPrompts,
  setupValidTeamsAndAssignments,
  triviaPromptFixture
} from "./testHarness.js";

const recordTriviaAttempt = (isCorrect: boolean): void => {
  dispatchMinigameAction("TRIVIA", "recordAttempt", { isCorrect });
};

beforeEach(() => {
  resetRoomState();
});

test("initializes trivia turn state through the minigame module boundary", () => {
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
  assert.equal(resolveHostPromptCursor(snapshot), null);

  const geoHostView = resolveGeoHostView(snapshot.minigameHostView);

  assert.equal(geoHostView?.currentSubState, "guessing");
  assert.equal(geoHostView?.currentPrompt, null);
});

test("GEO runtime scores submitted guesses for the active team only", () => {
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0], minigame: "GEO" }],
    minigameRules: {
      geo: {
        promptsPerTurn: 2
      }
    }
  });
  setRoomStateGeoPrompts(geoPromptFixture);
  advanceToEatingPhase();
  setWingParticipation("player-1", false);
  advanceRoomStatePhase();

  let geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentSubState, "guessing");
  assert.equal(geoHostView?.currentPrompt?.id, "geo-prompt-1");
  assert.equal(geoHostView?.promptsPerTurn, 2);
  assert.equal(geoHostView?.currentGuess, null);

  dispatchMinigameAction("GEO", "setGuess", { lat: 48.85837, lng: 2.294481 });

  geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.deepEqual(geoHostView?.currentGuess, { lat: 48.85837, lng: 2.294481 });

  dispatchMinigameAction("GEO", "submitGuess", {});

  const snapshot = getRoomStateSnapshot();
  geoHostView = resolveGeoHostView(snapshot.minigameHostView);

  assert.equal(geoHostView?.currentSubState, "submitted");
  assert.equal(geoHostView?.promptsCompletedThisTurn, 1);
  // An exact-coordinate guess lands in the closest score band (5 points).
  assert.equal(geoHostView?.lastResult?.pointsAwarded, 5);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 5);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], undefined);

  dispatchMinigameAction("GEO", "nextPrompt", {});

  geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentSubState, "guessing");
  assert.equal(geoHostView?.currentPrompt?.id, "geo-prompt-2");
  assert.equal(geoHostView?.currentGuess, null);
});

test("GEO display view stays answer-safe until the guess is submitted", () => {
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0], minigame: "GEO" }]
  });
  setRoomStateGeoPrompts(geoPromptFixture);
  advanceToEatingPhase();
  setWingParticipation("player-1", false);
  advanceRoomStatePhase();

  const guessingSnapshot = getRoomStateSnapshot();
  const guessingDisplayView = guessingSnapshot.minigameDisplayView;

  assert.equal(guessingDisplayView?.minigame, "GEO");

  const serializedGuessingView = JSON.stringify(guessingDisplayView);

  assert.equal(serializedGuessingView.includes("answerLat"), false);
  assert.equal(serializedGuessingView.includes("answerLng"), false);
  assert.equal(serializedGuessingView.includes("48.85837"), false);
  assert.equal(
    guessingDisplayView?.minigame === "GEO" ? guessingDisplayView.status : null,
    "guessing"
  );

  dispatchMinigameAction("GEO", "setGuess", { lat: 40, lng: 2 });

  const placedSnapshot = JSON.stringify(getRoomStateSnapshot().minigameDisplayView);

  assert.equal(placedSnapshot.includes("answerLat"), false);

  dispatchMinigameAction("GEO", "submitGuess", {});

  const submittedDisplayView = getRoomStateSnapshot().minigameDisplayView;

  assert.equal(submittedDisplayView?.minigame, "GEO");

  if (submittedDisplayView?.minigame === "GEO") {
    assert.equal(submittedDisplayView.status, "submitted");

    if (submittedDisplayView.status === "submitted") {
      assert.equal(submittedDisplayView.result.answerLat, 48.85837);
      assert.equal(submittedDisplayView.result.answerLng, 2.294481);
      assert.equal(submittedDisplayView.result.guessLat, 40);
    }
  }

  const displaySnapshot = toDisplayRoomStateSnapshot(getRoomStateSnapshot());

  assert.equal("minigameHostView" in displaySnapshot, false);
});

test("GEO actions are dropped outside their valid sub-states", () => {
  setupValidTeamsAndAssignments({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0], minigame: "GEO" }]
  });
  setRoomStateGeoPrompts(geoPromptFixture);
  advanceToEatingPhase();
  setWingParticipation("player-1", false);
  advanceRoomStatePhase();

  // Submit without a placed guess is ignored.
  dispatchMinigameAction("GEO", "submitGuess", {});

  let geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentSubState, "guessing");
  assert.equal(geoHostView?.promptsCompletedThisTurn, 0);

  // nextPrompt while guessing is ignored.
  dispatchMinigameAction("GEO", "nextPrompt", {});

  geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentPrompt?.id, "geo-prompt-1");

  // Out-of-range payloads are ignored.
  dispatchMinigameAction("GEO", "setGuess", { lat: 999, lng: 2 });

  geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentGuess, null);

  // setGuess after submit is ignored.
  dispatchMinigameAction("GEO", "setGuess", { lat: 10, lng: 10 });
  dispatchMinigameAction("GEO", "submitGuess", {});
  dispatchMinigameAction("GEO", "setGuess", { lat: 20, lng: 20 });

  geoHostView = resolveGeoHostView(getRoomStateSnapshot().minigameHostView);

  assert.equal(geoHostView?.currentSubState, "submitted");
  assert.deepEqual(geoHostView?.currentGuess, { lat: 10, lng: 10 });
});

test("recordTriviaAttempt applies points for active round team and wraps prompts", () => {
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
  setupValidTeamsAndAssignments();
  setRoomStateTriviaPrompts(triviaPromptFixture);
  advanceToMinigamePlayPhase();
  setPendingMinigamePoints({ "team-1": 15 });

  recordTriviaAttempt(true);

  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 15);
});

test("recordTriviaAttempt ignores calls outside TRIVIA MINIGAME_PLAY", () => {
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
  setupValidTeamsAndAssignments();
  advanceToMinigamePlayPhase();

  setPendingMinigamePoints({ "team-1": 6 });
  const snapshot = getRoomStateSnapshot();

  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-1"], 6);
  assert.equal(snapshot.pendingMinigamePointsByTeamId["team-2"], 0);
});

test("setPendingMinigamePoints rejects non-active team score mutations", () => {
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
