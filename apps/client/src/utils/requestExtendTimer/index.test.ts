import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  TIMER_EXTEND_MAX_SECONDS,
  type TimerExtendPayload
} from "@wingnight/shared";

import { requestExtendTimer } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type ExtendTimerSocket = Parameters<typeof requestExtendTimer>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    TimerExtendPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestExtendTimer(
    socket as unknown as ExtendTimerSocket,
    15,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid extension seconds", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    TimerExtendPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND);

  assert.equal(
    requestExtendTimer(socket as unknown as ExtendTimerSocket, 0, undefined, () => "secret"),
    false
  );
  assert.equal(
    requestExtendTimer(socket as unknown as ExtendTimerSocket, -5, undefined, () => "secret"),
    false
  );
  assert.equal(
    requestExtendTimer(
      socket as unknown as ExtendTimerSocket,
      TIMER_EXTEND_MAX_SECONDS + 1,
      undefined,
      () => "secret"
    ),
    false
  );
  assert.equal(emittedPayloads.length, 0);
});

test("emits timer:extend payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    TimerExtendPayload
  >(CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND);

  const wasRequested = requestExtendTimer(
    socket as unknown as ExtendTimerSocket,
    15,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [
    { hostSecret: "valid-host-secret", additionalSeconds: 15 }
  ]);
});
