import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestSkipTurnBoundary } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type SkipTurnBoundarySocket = Parameters<typeof requestSkipTurnBoundary>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestSkipTurnBoundary(
    socket as unknown as SkipTurnBoundarySocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits game:skipTurnBoundary payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY);

  const wasRequested = requestSkipTurnBoundary(
    socket as unknown as SkipTurnBoundarySocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
