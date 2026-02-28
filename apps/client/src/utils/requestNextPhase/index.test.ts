import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestNextPhase } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type NextPhaseSocket = Parameters<typeof requestNextPhase>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestNextPhase(
    socket as unknown as NextPhaseSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits game:nextPhase payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE);

  const wasRequested = requestNextPhase(
    socket as unknown as NextPhaseSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
