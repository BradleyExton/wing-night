import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { Phase, type ContestantTurn } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  dispatchMinigameAction,
  getRoomStateSnapshot,
  resetRoomState,
  setRoundDeviceMode
} from "../index.js";
import {
  advanceToTeamTurn,
  advanceUntil,
  dropPhone,
  seatPhone,
  setupArcadeNight,
  wakePhone
} from "../testHarness.js";

const turn = (): ContestantTurn => {
  const contestantTurn = getRoomStateSnapshot().contestantTurn;

  assert.ok(contestantTurn !== null, "the arcade turn should be locked");

  return contestantTurn;
};

beforeEach(() => {
  resetRoomState();
  setupArcadeNight();
});

test("does lock the round's device mode into the turn when its briefing opens", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  assert.deepEqual(turn(), {
    minigame: "FAPPY",
    deviceMode: "phones",
    legIndex: null,
    contestantPlayerId: null,
    nextContestantPlayerId: null,
    controller: "tablet",
    tabletLegIndexes: [],
    droppedPlayerId: null
  });
});

test("does keep a turn on the mode it opened with when the host changes it mid-turn", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_INTRO, 1);
  setRoundDeviceMode(1, "tablet");

  assert.equal(getRoomStateSnapshot().roundDeviceModes[1], "tablet");
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  assert.equal(turn().deviceMode, "phones");

  // The next team's briefing locks the round's mode afresh.
  advanceToTeamTurn(Phase.MINIGAME_INTRO, 1, "team-2");
  assert.equal(turn().deviceMode, "tablet");
});

test("does play a round on the tablet when the host never set it", () => {
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  seatPhone("player-1");

  assert.equal(turn().deviceMode, "tablet");
  assert.equal(turn().contestantPlayerId, "player-1");
  assert.equal(turn().controller, "tablet");
});

test("does refuse a device mode for a round whose game has no phone turns", () => {
  setRoundDeviceMode(5, "phones");
  setRoundDeviceMode(9, "phones");

  assert.deepEqual(getRoomStateSnapshot().roundDeviceModes, {});
});

test("does leave no arcade turn for a game without phone turns", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_INTRO, 5, 256);

  assert.equal(getRoomStateSnapshot().currentRoundConfig?.minigame, "TRIVIA");
  assert.equal(getRoomStateSnapshot().contestantTurn, null);
});

test("does hand the leg to the contestant's phone only once it is claimed and awake", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  // Unclaimed: the tablet plays it, no ceremony.
  assert.equal(turn().legIndex, 0);
  assert.equal(turn().contestantPlayerId, "player-1");
  assert.equal(turn().nextContestantPlayerId, "player-2");
  assert.equal(turn().controller, "tablet");

  seatPhone("player-1");
  assert.equal(turn().controller, "phone");

  // A teammate's phone is not the contestant's.
  seatPhone("player-2");
  assert.equal(turn().contestantPlayerId, "player-1");
});

test("does move the leg on to the next teammate's phone when the leg ends", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  seatPhone("player-1");
  seatPhone("player-2");

  dispatchMinigameAction("FAPPY", "skipLeg", {});

  assert.equal(turn().legIndex, 1);
  assert.equal(turn().contestantPlayerId, "player-2");
  assert.equal(turn().nextContestantPlayerId, null);
  assert.equal(turn().controller, "phone");
});

test("does raise the drop flag when the phone holding the leg drops and clear it on return", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.MINIGAME_PLAY, 1);
  seatPhone("player-1");

  dropPhone("player-1");
  assert.equal(turn().droppedPlayerId, "player-1");
  assert.equal(turn().controller, "tablet");

  // Still down after anything else moves the room.
  dispatchMinigameAction("FAPPY", "resetTurn", {});
  assert.equal(turn().droppedPlayerId, "player-1");

  wakePhone("player-1");
  assert.equal(turn().droppedPlayerId, null);
  assert.equal(turn().controller, "phone");
});

test("does raise no flag for a phone that was asleep before its leg came up", () => {
  setRoundDeviceMode(1, "phones");
  seatPhone("player-1");
  seatPhone("player-2");
  dropPhone("player-2");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  dispatchMinigameAction("FAPPY", "skipLeg", {});

  assert.equal(turn().contestantPlayerId, "player-2");
  assert.equal(turn().controller, "tablet");
  assert.equal(turn().droppedPlayerId, null);
});

test("does keep a leg the tablet began on the tablet when the phone wakes up mid-leg", () => {
  setRoundDeviceMode(1, "phones");
  seatPhone("player-1");
  dropPhone("player-1");
  advanceUntil(Phase.MINIGAME_PLAY, 1);

  dispatchMinigameAction("FAPPY", "flap", { tick: 0 });
  wakePhone("player-1");

  assert.deepEqual(turn().tabletLegIndexes, [0]);
  assert.equal(turn().controller, "tablet");
});

test("does let the turn go when the turn's results give way to the round's", () => {
  setRoundDeviceMode(1, "phones");
  advanceUntil(Phase.TURN_RESULTS, 1);
  assert.equal(turn().legIndex, null);

  advanceRoomStatePhase();
  advanceUntil(Phase.ROUND_RESULTS, 1);
  assert.equal(getRoomStateSnapshot().contestantTurn, null);
});
