import assert from "node:assert/strict";
import test from "node:test";

import { resolveSandboxHostRoomState } from "./index";

test("returns no room state at the intro phase even for a game with a clock", () => {
  assert.equal(resolveSandboxHostRoomState("GEO", "intro"), null);
});

test("returns no timer when the game is host-paced", () => {
  assert.equal(resolveSandboxHostRoomState("TRIVIA", "play"), null);
});

test("returns a paused full-duration timer for a game with a play-phase clock", () => {
  const roomState = resolveSandboxHostRoomState("GEO", "play");

  assert.notEqual(roomState, null);
  assert.equal(roomState?.timer?.isPaused, true);
  assert.equal(roomState?.timer?.durationMs, 45 * 1000);
  assert.equal(roomState?.timer?.remainingMs, 45 * 1000);
});
