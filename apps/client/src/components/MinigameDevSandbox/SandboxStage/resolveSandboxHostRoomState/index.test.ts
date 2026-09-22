import assert from "node:assert/strict";
import test from "node:test";
import type { Team } from "@wingnight/shared";

import { resolveSandboxHostRoomState } from "./index";

const TEAMS: Team[] = [
  {
    id: "team-1",
    name: "Molten Metal",
    genre: "metal",
    playerIds: ["player-1"],
    totalScore: 0
  }
];

test("returns no room state at the intro phase even for a game with a clock", () => {
  assert.equal(resolveSandboxHostRoomState("GEO", "intro", "team-1", TEAMS), null);
});

// The rail is a slot in the takeover now, so the preview has to hand it a room
// to read — a host-paced game gets one with no clock in it, not no room.
test("returns a room with no timer when the game is host-paced", () => {
  const roomState = resolveSandboxHostRoomState("TRIVIA", "play", "team-1", TEAMS);

  assert.notEqual(roomState, null);
  assert.equal(roomState?.timer, null);
  assert.equal(roomState?.activeTurnTeamId, "team-1");
  assert.equal(roomState?.teams[0]?.name, "Molten Metal");
});

test("returns a paused full-duration timer for a game with a play-phase clock", () => {
  const roomState = resolveSandboxHostRoomState("GEO", "play", "team-1", TEAMS);

  assert.notEqual(roomState, null);
  assert.equal(roomState?.timer?.isPaused, true);
  assert.equal(roomState?.timer?.durationMs, 45 * 1000);
  assert.equal(roomState?.timer?.remainingMs, 45 * 1000);
});

test("carries no turn team when the sandbox has none selected", () => {
  const roomState = resolveSandboxHostRoomState("TRIVIA", "play", null, []);

  assert.equal(roomState?.activeTurnTeamId, null);
  assert.deepEqual(roomState?.teams, []);
});
