import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestAutoAssignRemainingPlayers } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type AutoAssignRemainingPlayersSocket = Parameters<
  typeof requestAutoAssignRemainingPlayers
>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS);

  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = requestAutoAssignRemainingPlayers(
    socket as unknown as AutoAssignRemainingPlayersSocket,
    missingHostSecretTracker.onMissingHostSecret
  );

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("emits setup:autoAssignRemainingPlayers payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS);

  const didEmit = requestAutoAssignRemainingPlayers(
    socket as unknown as AutoAssignRemainingPlayersSocket,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "host-secret" }]);
});
