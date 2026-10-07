import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  toRoleScopedSnapshotEnvelope,
  type GameConfigFile,
  type MinigameDisplayView,
  type MinigameHostView
} from "@wingnight/shared";

import { playerClaimStore } from "../../playerClaims/index.js";
import {
  assignPlayerToTeam,
  createTeam,
  dispatchMinigameAction,
  dispatchPlayerAnswerAction,
  getRoomStateSnapshot,
  readContestantActionRefusal,
  readMinigamePlayerView,
  readPlayerAnswerRefusal,
  redoLastScoringMutation,
  releasePlayerAnswer,
  resetRoomState,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStatePlayers,
  syncPlayerClaimFlags
} from "../index.js";
import { getScoringMutationUndoSnapshot } from "../stateStore/index.js";
import {
  advanceToTeamTurn,
  advanceUntil,
  dropPhone,
  gameConfigFixture,
  geoPromptFixture,
  seatPhone,
  setRoomStateGeoPrompts
} from "../testHarness.js";

// Answers on the phones over the room's real phase machine: round 1 is GEO, round 2 TRIVIA. Team 1
// (Alex, Caitlin, Dan) opens round 1 and answers on its phones; team 2 (Rob) watches.

const answersConfig: GameConfigFile = {
  ...gameConfigFixture,
  rounds: [
    { ...gameConfigFixture.rounds[0], round: 1, minigame: "GEO" },
    { ...gameConfigFixture.rounds[0], round: 2, minigame: "TRIVIA" }
  ],
  minigameRules: { geo: { promptsPerTurn: 2 }, trivia: { questionsPerTurn: 2 } }
};

const setupNight = (): void => {
  setRoomStateGameConfig(answersConfig);
  setRoomStatePlayers([
    { id: "player-1", name: "Alex" },
    { id: "player-2", name: "Caitlin" },
    { id: "player-3", name: "Dan" },
    { id: "player-4", name: "Rob" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-1");
  assignPlayerToTeam("player-3", "team-1");
  assignPlayerToTeam("player-4", "team-2");
  setRoomStateGeoPrompts(geoPromptFixture);
  setRoomStateMinigameContent("TRIVIA", {
    // Team 1 sits second in round 2's order, so its slice of the bank starts at index 2.
    prompts: [
      { id: "mc-2", question: "Heat scale?", answer: "Scoville", choices: ["Scoville", "Richter"] },
      { id: "spoken-1", question: "Spoken?", answer: "Yes" },
      { id: "mc-1", question: "Hottest?", answer: "Reaper", choices: ["Jalapeño", "Reaper", "Poblano"] }
    ]
  });
};

const geoHost = (view: MinigameHostView | null) => (view?.minigame === "GEO" ? view : null);
const geoDisplay = (view: MinigameDisplayView | null) => (view?.minigame === "GEO" ? view : null);
const triviaDisplay = (view: MinigameDisplayView | null) => (view?.minigame === "TRIVIA" ? view : null);

const pin = (playerId: string, lat: number, lng: number) => {
  return dispatchPlayerAnswerAction(playerId, "GEO", "placePin", { lat, lng });
};

beforeEach(() => {
  resetRoomState();
  setupNight();
});

const startGeoTurn = (): void => {
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  assert.equal(getRoomStateSnapshot().activeRoundTeamId, "team-1");
};

test("does accept a pin when it comes from a seated phone on the playing team", () => {
  startGeoTurn();
  seatPhone("player-1");

  assert.equal(readPlayerAnswerRefusal("player-1", "GEO", "placePin"), null);

  const snapshot = pin("player-1", 48.85, 2.29);

  assert.deepEqual(geoHost(snapshot.minigameHostView)?.phoneAnswers, {
    answeredCount: 1,
    seatedCount: 1
  });
});

test("does refuse an answer when it comes from the other team, an unclaimed face or a host action", () => {
  startGeoTurn();
  seatPhone("player-4");

  assert.equal(
    readPlayerAnswerRefusal("player-4", "GEO", "placePin"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_ON_TURN
  );
  assert.equal(
    readPlayerAnswerRefusal("player-2", "GEO", "placePin"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_SEATED
  );
  assert.equal(
    readPlayerAnswerRefusal("player-4", "GEO", "submitGuess"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION
  );
  assert.equal(
    readPlayerAnswerRefusal("player-4", "TRIVIA", "chooseAnswer"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE
  );

  // The mutation asks again, so a direct call changes nothing either.
  const before = getRoomStateSnapshot();

  pin("player-4", 48.85, 2.29);
  pin("player-2", 48.85, 2.29);

  assert.deepEqual(getRoomStateSnapshot().minigameHostView, before.minigameHostView);
});

test("does refuse an answer when the turn is not being played", () => {
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  seatPhone("player-1");

  assert.equal(
    readPlayerAnswerRefusal("player-1", "GEO", "placePin"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE
  );
  assert.equal(readMinigamePlayerView("player-1", true), null);
});

test("does refuse a pin when the host has already locked the photo", () => {
  startGeoTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  pin("player-1", 48.85, 2.29);
  dispatchMinigameAction("GEO", "submitGuess", {});

  const locked = getRoomStateSnapshot();

  pin("player-2", 48.858, 2.294);

  assert.deepEqual(getRoomStateSnapshot().minigameHostView, locked.minigameHostView);
});

test("does not make an undo point when a phone pins", () => {
  startGeoTurn();
  seatPhone("player-1");

  const undoBefore = getScoringMutationUndoSnapshot();
  const canRedoBefore = getRoomStateSnapshot().canRedoScoringMutation;

  pin("player-1", 48.85, 2.29);
  pin("player-1", 41.9, 12.5);

  assert.equal(getScoringMutationUndoSnapshot(), undoBefore);
  assert.equal(getRoomStateSnapshot().canRedoScoringMutation, canRedoBefore);
});

test("does score the best pin and undo the host's lock back to the open photo when the host undoes", () => {
  startGeoTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  // The tablet's pin is far off; Caitlin's is on the tower.
  dispatchMinigameAction("GEO", "setGuess", { lat: 41.9, lng: 12.5 });
  pin("player-1", 48.9, 2.3);
  pin("player-2", 48.8584, 2.2945);

  const locked = dispatchMinigameAction("GEO", "submitGuess", {});
  const result = geoHost(locked.minigameHostView)?.lastResult;

  assert.equal(result?.pointsAwarded, 5);
  assert.deepEqual(result?.pins.map((entry) => [entry.name, entry.isBest]), [
    [null, false],
    ["Alex", false],
    ["Caitlin", true]
  ]);
  assert.equal(locked.pendingMinigamePointsByTeamId["team-1"], 5);

  const undone = redoLastScoringMutation();

  assert.equal(geoHost(undone.minigameHostView)?.currentSubState, "guessing");
  assert.equal(undone.pendingMinigamePointsByTeamId["team-1"] ?? 0, 0);
  // The pins are back in, open, and still the phones' own.
  assert.equal(geoHost(undone.minigameHostView)?.phoneAnswers?.answeredCount, 2);
  assert.equal(readPlayerAnswerRefusal("player-1", "GEO", "placePin"), null);
});

test("does keep the display and player snapshots to a count when phones have pinned an open photo", () => {
  startGeoTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  pin("player-1", 12.3456, 65.4321);

  const room = getRoomStateSnapshot();
  const display = toRoleScopedSnapshotEnvelope("DISPLAY", room).roomState;
  const phone = toRoleScopedSnapshotEnvelope("PLAYER", room).roomState;

  assert.deepEqual(geoDisplay(display.minigameDisplayView)?.phoneAnswers, { answeredCount: 1, seatedCount: 2 });

  for (const serialized of [JSON.stringify(display), JSON.stringify(phone), JSON.stringify(room.minigameHostView)]) {
    assert.equal(serialized.includes("12.3456"), false);
    assert.equal(serialized.includes("65.4321"), false);
  }

  // The display's game view names no player at all before the reveal.
  assert.equal(JSON.stringify(display.minigameDisplayView).includes("player-"), false);
});

test("does hand each phone only its own pin when two phones have pinned", () => {
  startGeoTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  pin("player-1", 12.3456, 65.4321);
  pin("player-2", -33.33, 151.15);

  const alex = readMinigamePlayerView("player-1", true);
  const caitlin = readMinigamePlayerView("player-2", true);

  assert.deepEqual(alex?.minigame === "GEO" ? alex.pin : undefined, { lat: 12.3456, lng: 65.4321 });
  assert.equal(JSON.stringify(alex).includes("151.15"), false);
  assert.equal(JSON.stringify(caitlin).includes("12.3456"), false);
  // The other team's phone has no card at all.
  seatPhone("player-4");
  assert.equal(readMinigamePlayerView("player-4", true), null);
});

test("does move the tally when a playing-team phone takes its face mid-photo", () => {
  startGeoTurn();
  seatPhone("player-1");

  assert.equal(geoDisplay(getRoomStateSnapshot().minigameDisplayView)?.phoneAnswers?.seatedCount, 1);

  seatPhone("player-3");

  assert.equal(geoDisplay(getRoomStateSnapshot().minigameDisplayView)?.phoneAnswers?.seatedCount, 2);
});

test("does drop an open pin when its phone's claim ends", () => {
  startGeoTurn();
  seatPhone("player-1");
  pin("player-1", 48.85, 2.29);
  playerClaimStore.release("player-1", "released_by_host");
  syncPlayerClaimFlags();

  const released = releasePlayerAnswer("player-1");

  assert.equal(geoDisplay(released.minigameDisplayView)?.phoneAnswers, null);

  seatPhone("player-1");
  assert.equal(geoHost(getRoomStateSnapshot().minigameHostView)?.phoneAnswers?.answeredCount, 0);
});

// Rounds rotate which team opens, so round 2's team-1 turn is named.
const startTriviaTurn = (): void => {
  advanceToTeamTurn(Phase.MINIGAME_PLAY, 2, "team-1");
};

const choose = (playerId: string, choiceIndex: number) => {
  return dispatchPlayerAnswerAction(playerId, "TRIVIA", "chooseAnswer", { choiceIndex });
};

test("does score the share of the seated phones that chose right when the host locks a question", () => {
  startTriviaTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  seatPhone("player-3");

  const prompt = (getRoomStateSnapshot().minigameHostView as { currentPrompt: { id: string } }).currentPrompt;

  assert.equal(prompt.id, "mc-1");
  choose("player-1", 1);
  choose("player-2", 1);
  choose("player-3", 0);

  const open = getRoomStateSnapshot();

  assert.deepEqual(triviaDisplay(open.minigameDisplayView)?.phoneAnswers, { answeredCount: 3, seatedCount: 3 });
  assert.equal(JSON.stringify(toRoleScopedSnapshotEnvelope("DISPLAY", open)).includes("correctIndex"), false);

  const locked = dispatchMinigameAction("TRIVIA", "lockChoices", {});
  const reveal = triviaDisplay(locked.minigameDisplayView)?.reveal;

  // Two of three right: round(2/3) = the question's one point.
  assert.deepEqual(reveal?.choiceCounts, [1, 2, 0]);
  assert.equal(reveal?.pointsAwarded, 1);
  assert.equal(locked.pendingMinigamePointsByTeamId["team-1"], 1);

  const alex = readMinigamePlayerView("player-1", true);

  assert.equal(alex?.minigame === "TRIVIA" ? alex.isCorrect : undefined, true);

  // And the host's undo takes the lock back, choices and all.
  const undone = redoLastScoringMutation();

  assert.equal(triviaDisplay(undone.minigameDisplayView)?.reveal, null);
  assert.equal(undone.pendingMinigamePointsByTeamId["team-1"] ?? 0, 0);
  assert.equal(triviaDisplay(undone.minigameDisplayView)?.phoneAnswers?.answeredCount, 3);
});

test("does keep a departed holder's pin from the next guest in the face when the host undoes the lock", () => {
  startGeoTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  pin("player-1", 48.8584, 2.2945);
  pin("player-2", 10, 10);
  dispatchMinigameAction("GEO", "submitGuess", {});

  // Alex lets the face go after the lock (the locked pin stays, as it should)...
  playerClaimStore.release("player-1", "released_by_host");
  syncPlayerClaimFlags();
  releasePlayerAnswer("player-1");

  // ...the host undoes the lock, and a new guest sits in Alex's face.
  redoLastScoringMutation();
  seatPhone("player-1", "socket-new-guest");

  const newGuestCard = readMinigamePlayerView("player-1", false);

  assert.equal(newGuestCard?.minigame === "GEO" ? newGuestCard.pin : undefined, null);
  // Only Caitlin's pin is in: the new guest has not pinned, and nothing of Alex's is counted for them.
  assert.equal(geoHost(getRoomStateSnapshot().minigameHostView)?.phoneAnswers?.answeredCount, 1);

  const relocked = geoHost(dispatchMinigameAction("GEO", "submitGuess", {}).minigameHostView);

  assert.deepEqual(relocked?.lastResult?.pins.map((entry) => entry.name), ["Caitlin"]);
});

test("does refuse a phone that sends the host's GEO lock, tablet pin or next photo when it is seated", () => {
  startGeoTurn();
  seatPhone("player-1");

  for (const actionType of ["submitGuess", "setGuess", "nextPrompt"]) {
    assert.notEqual(readContestantActionRefusal("player-1", "GEO", actionType), null, actionType);
    assert.equal(
      readPlayerAnswerRefusal("player-1", "GEO", actionType),
      PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION,
      actionType
    );
  }
});

test("does refuse a phone that sends the host's TRIVIA lock, next or verdict when it is seated", () => {
  startTriviaTurn();
  seatPhone("player-1");

  for (const actionType of ["lockChoices", "nextQuestion", "recordAttempt"]) {
    assert.notEqual(readContestantActionRefusal("player-1", "TRIVIA", actionType), null, actionType);
    assert.equal(
      readPlayerAnswerRefusal("player-1", "TRIVIA", actionType),
      PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION,
      actionType
    );
  }
});

test("does leave an asleep phone that never chose out of the TRIVIA share when the host locks", () => {
  startTriviaTurn();
  seatPhone("player-1");
  seatPhone("player-2");
  seatPhone("player-3");
  dropPhone("player-3");
  choose("player-1", 1);
  choose("player-2", 0);

  const locked = dispatchMinigameAction("TRIVIA", "lockChoices", {});
  const reveal = triviaDisplay(locked.minigameDisplayView)?.reveal;

  // Over the two awake phones: one right of two rounds to the question's point.
  assert.equal(reveal?.seatedCount, 2);
  assert.equal(reveal?.pointsAwarded, 1);
});
