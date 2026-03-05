import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";
import {
  buildRoomState,
  createMutationHandlers,
  createSocketHarness,
  hostAuth,
  toHostSnapshotEnvelope
} from "./testHarness.js";

test("emits state snapshot immediately and on client request", () => {
  const socketHarness = createSocketHarness();
  const firstState = buildRoomState(Phase.SETUP, 0);

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(firstState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    true,
    hostAuth
  );

  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(firstState));

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[1], toHostSnapshotEnvelope(firstState));
});

test("emits host secret when host claims control and socket is authorized", () => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    true,
    {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => false
    }
  );

  socketHarness.triggerHostClaim();

  assert.deepEqual(socketHarness.emittedSecretPayloads, [
    { hostSecret: "issued-host-secret" }
  ]);
});

test("does not emit host secret when socket is not allowed to claim control", () => {
  const socketHarness = createSocketHarness();

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }),
    false,
    hostAuth
  );

  socketHarness.triggerHostClaim();

  assert.equal(socketHarness.emittedSecretPayloads.length, 0);
});
