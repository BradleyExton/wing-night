import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestPauseTimer } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type PauseTimerSocket = Parameters<typeof requestPauseTimer>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestPauseTimer(
    socket as unknown as PauseTimerSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits timer:pause payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE);

  const wasRequested = requestPauseTimer(
    socket as unknown as PauseTimerSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
