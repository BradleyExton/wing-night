import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { requestRedoLastMutation } from "./index";
import {
  createMissingHostSecretTracker,
  createRequestSocketHarness
} from "../requestTestHarness";

type RedoLastMutationSocket = Parameters<typeof requestRedoLastMutation>[0];

test("returns false and emits nothing when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const wasRequested = requestRedoLastMutation(
    socket as unknown as RedoLastMutationSocket,
    missingHostSecretTracker.onMissingHostSecret,
    () => null
  );

  assert.equal(wasRequested, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.equal(emittedPayloads.length, 0);
});

test("emits scoring:redoLastMutation payload when host secret exists", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION);

  const wasRequested = requestRedoLastMutation(
    socket as unknown as RedoLastMutationSocket,
    undefined,
    () => "valid-host-secret"
  );

  assert.equal(wasRequested, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
