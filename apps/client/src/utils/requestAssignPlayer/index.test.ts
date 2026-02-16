import assert from "node:assert/strict";
import test from "node:test";

import type { SetupAssignPlayerPayload } from "@wingnight/shared";

import { requestAssignPlayer } from "./index";

type AssignPlayerSocket = Parameters<typeof requestAssignPlayer>[0];

class MockAssignPlayerSocket {
  public emittedPayloads: SetupAssignPlayerPayload[] = [];

  public emit(event: "setup:assignPlayer", payload: SetupAssignPlayerPayload): void {
    if (event === "setup:assignPlayer") {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockAssignPlayerSocket();
  let missingSecretCalls = 0;

  const didEmit = requestAssignPlayer(
    socket as unknown as AssignPlayerSocket,
    "player-1",
    "team-1",
    () => {
      missingSecretCalls += 1;
    },
    () => null
  );

  assert.equal(didEmit, false);
  assert.equal(missingSecretCalls, 1);
  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits setup:assignPlayer payload when host secret exists", () => {
  const socket = new MockAssignPlayerSocket();

  const didEmit = requestAssignPlayer(
    socket as unknown as AssignPlayerSocket,
    "player-1",
    null,
    undefined,
    () => "host-secret"
  );

  assert.equal(didEmit, true);
  assert.deepEqual(socket.emittedPayloads, [
    { hostSecret: "host-secret", playerId: "player-1", teamId: null }
  ]);
});
