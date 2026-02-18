import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestResetGame } from "./index";

type ResetGameSocket = Parameters<typeof requestResetGame>[0];

class MockResetGameSocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.RESET,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.RESET) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockResetGameSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestResetGame(
    socket as unknown as ResetGameSocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits game:reset payload when host secret exists", () => {
  const socket = new MockResetGameSocket();

  const wasRequested = requestResetGame(
    socket as unknown as ResetGameSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
