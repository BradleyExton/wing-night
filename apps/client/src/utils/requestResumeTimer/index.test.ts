import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestResumeTimer } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type ResumeTimerSocket = Parameters<typeof requestResumeTimer>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestResumeTimer(
    socket as unknown as ResumeTimerSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits timer:resume payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_RESUME);

  const wasRequested = requestResumeTimer(
    socket as unknown as ResumeTimerSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
