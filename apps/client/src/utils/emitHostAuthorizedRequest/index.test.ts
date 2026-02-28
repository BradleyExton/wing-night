import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  type HostSecretPayload
} from "@wingnight/shared";

import { emitHostAuthorizedRequest } from "./index";
import { createMissingHostSecretTracker, createRequestSocketHarness } from "../requestTestHarness";

type EmitHostAuthorizedRequestSocket = Parameters<
  typeof emitHostAuthorizedRequest<typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE>
>[0]["socket"];

test("returns false and triggers callback when host secret is unavailable", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE);
  const missingHostSecretTracker = createMissingHostSecretTracker();

  const didEmit = emitHostAuthorizedRequest({
    socket: socket as unknown as EmitHostAuthorizedRequestSocket,
    event: CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    createPayload: (hostSecret) => ({ hostSecret }),
    onMissingHostSecret: missingHostSecretTracker.onMissingHostSecret,
    getHostSecret: () => null
  });

  assert.equal(didEmit, false);
  assert.equal(missingHostSecretTracker.readCallCount(), 1);
  assert.deepEqual(emittedPayloads, []);
});

test("returns false and emits nothing when canEmit rejects", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE);

  const didEmit = emitHostAuthorizedRequest({
    socket: socket as unknown as EmitHostAuthorizedRequestSocket,
    event: CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    createPayload: (hostSecret) => ({ hostSecret }),
    canEmit: () => false,
    getHostSecret: () => "valid-host-secret"
  });

  assert.equal(didEmit, false);
  assert.deepEqual(emittedPayloads, []);
});

test("returns true and emits event payload once when checks pass", () => {
  const { socket, emittedPayloads } = createRequestSocketHarness<
    typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    HostSecretPayload
  >(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE);

  const didEmit = emitHostAuthorizedRequest({
    socket: socket as unknown as EmitHostAuthorizedRequestSocket,
    event: CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    createPayload: (hostSecret) => ({ hostSecret }),
    getHostSecret: () => "valid-host-secret"
  });

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});

test("emits with socket method context intact", () => {
  const emittedPayloads: HostSecretPayload[] = [];
  const socket = {
    isSocket: true,
    emit(
      this: { isSocket: boolean },
      event: typeof CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
      payload: HostSecretPayload
    ): void {
      assert.equal(this.isSocket, true);
      if (event === CLIENT_TO_SERVER_EVENTS.NEXT_PHASE) {
        emittedPayloads.push(payload);
      }
    }
  };

  const didEmit = emitHostAuthorizedRequest({
    socket: socket as unknown as EmitHostAuthorizedRequestSocket,
    event: CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    createPayload: (hostSecret) => ({ hostSecret }),
    getHostSecret: () => "valid-host-secret"
  });

  assert.equal(didEmit, true);
  assert.deepEqual(emittedPayloads, [{ hostSecret: "valid-host-secret" }]);
});
