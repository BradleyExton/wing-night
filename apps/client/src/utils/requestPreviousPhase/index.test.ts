import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestPreviousPhase } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type PreviousPhaseSocket = Parameters<typeof requestPreviousPhase>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.PREVIOUS_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.PREVIOUS_PHASE);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestPreviousPhase(
    socket as unknown as PreviousPhaseSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits game:previousPhase payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.PREVIOUS_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.PREVIOUS_PHASE);

  const wasRequested = requestPreviousPhase(
    socket as unknown as PreviousPhaseSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
