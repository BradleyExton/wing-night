import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  TIMER_EXTEND_MAX_SECONDS,
  type TimerExtendPayload
} from "@wingnight/shared";

import { requestExtendTimer } from "./index";

type ExtendTimerSocket = Parameters<typeof requestExtendTimer>[0];

class MockExtendTimerSocket {
  public emittedPayloads: TimerExtendPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    payload: TimerExtendPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockExtendTimerSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestExtendTimer(
    socket as unknown as ExtendTimerSocket,
    15,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid extension seconds", () => {
  const socket = new MockExtendTimerSocket();

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
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits timer:extend payload when host secret exists", () => {
  const socket = new MockExtendTimerSocket();

  const wasRequested = requestExtendTimer(
    socket as unknown as ExtendTimerSocket,
    15,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [
    { hostSecret: "valid-host-secret", additionalSeconds: 15 }
  ]);
});
