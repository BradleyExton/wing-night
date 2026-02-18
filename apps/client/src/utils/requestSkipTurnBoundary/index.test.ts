import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestSkipTurnBoundary } from "./index";

type SkipTurnBoundarySocket = Parameters<typeof requestSkipTurnBoundary>[0];

class MockSkipTurnBoundarySocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockSkipTurnBoundarySocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestSkipTurnBoundary(
    socket as unknown as SkipTurnBoundarySocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits game:skipTurnBoundary payload when host secret exists", () => {
  const socket = new MockSkipTurnBoundarySocket();

  const wasRequested = requestSkipTurnBoundary(
    socket as unknown as SkipTurnBoundarySocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
