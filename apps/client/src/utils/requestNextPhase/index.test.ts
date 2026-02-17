import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestNextPhase } from "./index";

type NextPhaseSocket = Parameters<typeof requestNextPhase>[0];

class MockNextPhaseSocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.NEXT_PHASE) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockNextPhaseSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestNextPhase(
    socket as unknown as NextPhaseSocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits game:nextPhase payload when host secret exists", () => {
  const socket = new MockNextPhaseSocket();

  const wasRequested = requestNextPhase(
    socket as unknown as NextPhaseSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
