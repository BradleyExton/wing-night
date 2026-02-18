import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type GameReorderTurnOrderPayload
} from "@wingnight/shared";

import { requestReorderTurnOrder } from "./index";

type ReorderTurnOrderSocket = Parameters<typeof requestReorderTurnOrder>[0];

class MockReorderTurnOrderSocket {
  public emittedPayloads: GameReorderTurnOrderPayload[] = [];

  public emit(
    event: typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    payload: GameReorderTurnOrderPayload
  ): void {
    if (event === CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER) {
      this.emittedPayloads.push(payload);
    }
  }
}

test("returns false and emits nothing when host secret is unavailable", () => {
  const socket = new MockReorderTurnOrderSocket();
  let missingHostSecretCallbackCount = 0;

  const wasRequested = requestReorderTurnOrder(
    socket as unknown as ReorderTurnOrderSocket,
    ["team-1", "team-2"],
    () => {
      missingHostSecretCallbackCount += 1;
    },
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretCallbackCount, 1);
  assert.equal(socket.emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid team id lists", () => {
  const socket = new MockReorderTurnOrderSocket();

  assert.equal(
    requestReorderTurnOrder(
      socket as unknown as ReorderTurnOrderSocket,
      [],
      undefined,
      () => "host-secret"
    ),
    false
  );
  assert.equal(
    requestReorderTurnOrder(
      socket as unknown as ReorderTurnOrderSocket,
      ["team-1", "team-1"],
      undefined,
      () => "host-secret"
    ),
    false
  );
  assert.equal(
    requestReorderTurnOrder(
      socket as unknown as ReorderTurnOrderSocket,
      ["team-1", ""],
      undefined,
      () => "host-secret"
    ),
    false
  );

  assert.deepEqual(socket.emittedPayloads, []);
});

test("emits game:reorderTurnOrder payload when host secret exists", () => {
  const socket = new MockReorderTurnOrderSocket();

  const wasRequested = requestReorderTurnOrder(
    socket as unknown as ReorderTurnOrderSocket,
    ["team-2", "team-1"],
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(socket.emittedPayloads, [
    {
      hostSecret: "valid-host-secret",
      teamIds: ["team-2", "team-1"]
    }
  ]);
});
