import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameTogglePassAndPlayLockPayload
} from "@wingnight/shared";

import { requestTogglePassAndPlayLock } from "./index";

type TogglePassAndPlayLockSocket = Parameters<
  typeof requestTogglePassAndPlayLock
>[0];

class MockTogglePassAndPlayLockSocket {
  public emittedPayloads: MinigameTogglePassAndPlayLockPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK,
    payload: MinigameTogglePassAndPlayLockPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.TOGGLE_PASS_AND_PLAY_LOCK) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockTogglePassAndPlayLockSocket();
  let missingSecretCalls = 0;

  const didEmit = requestTogglePassAndPlayLock(
    socket as unknown as TogglePassAndPlayLockSocket,
    () => {
      missingSecretCalls += 1;
    },
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingSecretCalls, 1);
  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits minigame:togglePassAndPlayLock payload when host secret exists", () => {
  const socket = new MockTogglePassAndPlayLockSocket();

  const didEmit = requestTogglePassAndPlayLock(
    socket as unknown as TogglePassAndPlayLockSocket,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [{ hostSecret: "host-secret" }]);
});
