import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestResetGame } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type ResetGameSocket = Parameters<typeof requestResetGame>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.RESET,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.RESET);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestResetGame(
    socket as unknown as ResetGameSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits game:reset payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.RESET,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.RESET);

  const wasRequested = requestResetGame(
    socket as unknown as ResetGameSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
