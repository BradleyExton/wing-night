import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringAdjustTeamScorePayload
} from "@wingnight/shared";

import { requestAdjustTeamScore } from "./index";

type AdjustTeamScoreSocket = Parameters<typeof requestAdjustTeamScore>[0];

class MockAdjustTeamScoreSocket {
  public emittedPayloads: ScoringAdjustTeamScorePayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    payload: ScoringAdjustTeamScorePayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockAdjustTeamScoreSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestAdjustTeamScore(
    socket as unknown as AdjustTeamScoreSocket,
    "team-1",
    3,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid payloads", () => {
  const socket = new MockAdjustTeamScoreSocket();

  assert.equal(
    requestAdjustTeamScore(
      socket as unknown as AdjustTeamScoreSocket,
      "team-1",
      0,
      undefined,
      () => "host-secret"
    ),
    false
  );
  assert.equal(
    requestAdjustTeamScore(
      socket as unknown as AdjustTeamScoreSocket,
      "team-1",
      1.5,
      undefined,
      () => "host-secret"
    ),
    false
  );
  assert.equal(
    requestAdjustTeamScore(
      socket as unknown as AdjustTeamScoreSocket,
      " ",
      2,
      undefined,
      () => "host-secret"
    ),
    false
  );

  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits scoring:adjustTeamScore payload when host secret exists", () => {
  const socket = new MockAdjustTeamScoreSocket();

  const wasRequested = requestAdjustTeamScore(
    socket as unknown as AdjustTeamScoreSocket,
    "team-1",
    -2,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [
    {
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: -2
    }
  ]);
});
