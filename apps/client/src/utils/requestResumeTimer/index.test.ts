import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestResumeTimer } from "./index";

type ResumeTimerSocket = Parameters<typeof requestResumeTimer>[0];

class MockResumeTimerSocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.TIMER_RESUME,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.TIMER_RESUME) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockResumeTimerSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestResumeTimer(
    socket as unknown as ResumeTimerSocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits timer:resume payload when host secret exists", () => {
  const socket = new MockResumeTimerSocket();

  const wasRequested = requestResumeTimer(
    socket as unknown as ResumeTimerSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
