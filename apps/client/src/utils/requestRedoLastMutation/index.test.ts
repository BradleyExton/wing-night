import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestRedoLastMutation } from "./index";

type RedoLastMutationSocket = Parameters<typeof requestRedoLastMutation>[0];

class MockRedoLastMutationSocket {
  public emittedPayloads: HostSecretPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    payload: HostSecretPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockRedoLastMutationSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestRedoLastMutation(
    socket as unknown as RedoLastMutationSocket,
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("emits scoring:redoLastMutation payload when host secret exists", () => {
  const socket = new MockRedoLastMutationSocket();

  const wasRequested = requestRedoLastMutation(
    socket as unknown as RedoLastMutationSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
