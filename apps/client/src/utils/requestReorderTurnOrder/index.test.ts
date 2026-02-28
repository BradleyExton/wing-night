import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type GameReorderTurnOrderPayload
} from "@wingnight/shared";

import { requestReorderTurnOrder } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type ReorderTurnOrderSocket = Parameters<typeof requestReorderTurnOrder>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    GameReorderTurnOrderPayload
  >(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestReorderTurnOrder(
    socket as unknown as ReorderTurnOrderSocket,
    ["team-1", "team-2"],
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("returns false and emits nothing for invalid team id lists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    GameReorderTurnOrderPayload
  >(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER);

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

  assert.deepEqual(emittedPayloads, []);
});

test("emits game:reorderTurnOrder payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    GameReorderTurnOrderPayload
  >(CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER);

  const wasRequested = requestReorderTurnOrder(
    socket as unknown as ReorderTurnOrderSocket,
    ["team-2", "team-1"],
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [
    {
      hostSecret: "valid-host-secret",
      teamIds: ["team-2", "team-1"]
    }
  ]);
});
