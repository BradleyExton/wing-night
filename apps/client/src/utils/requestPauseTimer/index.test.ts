import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestPauseTimer } from "./index";

type PauseTimerSocket = Parameters<typeof requestPauseTimer>[0];

class MockPauseTimerSocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockPauseTimerSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestPauseTimer(
    socket as unknown as PauseTimerSocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits timer:pause payload when host secret exists", () => {
  const socket = new MockPauseTimerSocket();

  const wasRequested = requestPauseTimer(
    socket as unknown as PauseTimerSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
