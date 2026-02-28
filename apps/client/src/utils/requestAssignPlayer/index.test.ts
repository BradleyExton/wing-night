import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type SetupAssignPlayerPayload
} from "@wingnight/shared";

import { requestAssignPlayer } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type AssignPlayerSocket = Parameters<typeof requestAssignPlayer>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    SetupAssignPlayerPayload
  >(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestAssignPlayer(
    socket as unknown as AssignPlayerSocket,
    "player-1",
    "team-1",
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("emits setup:assignPlayer payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    SetupAssignPlayerPayload
  >(CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER);

  const didEmit = requestAssignPlayer(
    socket as unknown as AssignPlayerSocket,
    "player-1",
    null,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [
    { hostSecret: "host-secret", playerId: "player-1", teamId: null }
  ]);
});
