import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import { GAME_START_COUNTDOWN_MS, Phase } from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  getRoomStateSnapshot,
  resetRoomState,
  startGame
} from "../index.js";
import { setupValidTeamsAndAssignments } from "../testHarness.js";

const reachIntro = (): void => {
  setupValidTeamsAndAssignments();
  advanceRoomStatePhase();
  assert.equal(getRoomStateSnapshot().phase, Phase.INTRO);
};

beforeEach(() => {
  resetRoomState();
  mock.reset();
});

test("does arm the count-in and hold the phase when the host starts the game", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000 });
  reachIntro();

  const snapshot = startGame();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.gameStartCountdownEndsAt, 1_000 + GAME_START_COUNTDOWN_MS);
});

// The host taps once and the tablet sends the same event again at zero, so a
// second tablet — or a host that refreshed mid-count-in — must not be able to
// cut the room's count-in short.
test("does ignore a second start while the count-in is still running", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000 });
  reachIntro();
  startGame();

  mock.timers.tick(GAME_START_COUNTDOWN_MS - 1);
  const snapshot = startGame();

  assert.equal(snapshot.phase, Phase.INTRO);
  assert.equal(snapshot.gameStartCountdownEndsAt, 1_000 + GAME_START_COUNTDOWN_MS);
});

test("does start the round and clear the count-in once it has run out", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000 });
  reachIntro();
  startGame();

  mock.timers.tick(GAME_START_COUNTDOWN_MS);
  const snapshot = startGame();

  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(snapshot.currentRound, 1);
  assert.equal(snapshot.gameStartCountdownEndsAt, null);
});

// The handoff is a repeat of the same event, so the one that loses the race
// must find the room already past INTRO and do nothing.
test("does ignore a duplicate handoff once the round has started", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000 });
  reachIntro();
  startGame();

  mock.timers.tick(GAME_START_COUNTDOWN_MS);
  startGame();
  const snapshot = startGame();

  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(snapshot.gameStartCountdownEndsAt, null);
});

// The override rail's plain advance still works during INTRO, and skipping the
// count-in must not leave its instant behind for a later phase to inherit.
test("does clear a stale count-in when the phase is advanced straight through", () => {
  mock.timers.enable({ apis: ["Date"], now: 1_000 });
  reachIntro();
  startGame();

  const snapshot = advanceRoomStatePhase();

  assert.equal(snapshot.phase, Phase.MINIGAME_INTRO);
  assert.equal(snapshot.gameStartCountdownEndsAt, null);
});
