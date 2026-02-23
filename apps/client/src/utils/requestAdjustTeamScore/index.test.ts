import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type ScoringAdjustTeamScorePayload
} from "@wingnight/shared";

import { requestAdjustTeamScore } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type AdjustTeamScoreSocket = Parameters<typeof requestAdjustTeamScore>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    ScoringAdjustTeamScorePayload
  >(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestAdjustTeamScore(
    socket as unknown as AdjustTeamScoreSocket,
    "team-1",
    3,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid payloads", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    ScoringAdjustTeamScorePayload
  >(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE);

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

  assert.deepEqual(emittedPayloads, []);
});

test("emits scoring:adjustTeamScore payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    ScoringAdjustTeamScorePayload
  >(CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE);

  const wasRequested = requestAdjustTeamScore(
    socket as unknown as AdjustTeamScoreSocket,
    "team-1",
    -2,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [
    {
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: -2
    }
  ]);
});
