import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RoomState } from "@wingnight/shared";

import { registerRoomStateHandlers } from "./index.js";
import {
  buildRoomState,
  createMutationHandlers,
  createSocketHarness,
  hostAuth,
  toHostSnapshotEnvelope
} from "./testHarness.js";

test("ignores malformed game:nextPhase payloads", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    true,
    hostAuth
  );

  assert.doesNotThrow(() => {
    socketHarness.triggerNextPhase(undefined);
    socketHarness.triggerNextPhase(null);
    socketHarness.triggerNextPhase({});
    socketHarness.triggerNextPhase({ hostSecret: 1234 });
    socketHarness.triggerNextPhase("not-an-object");
  });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not validate host secret for malformed game:nextPhase payloads", () => {
  const socketHarness = createSocketHarness();
  let hostSecretValidationCalls = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers(),
    true,
    {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => {
        hostSecretValidationCalls += 1;
        return false;
      }
    }
  );

  socketHarness.triggerNextPhase(undefined);
  socketHarness.triggerNextPhase(null);
  socketHarness.triggerNextPhase({});
  socketHarness.triggerNextPhase({ hostSecret: 1234 });

  assert.equal(hostSecretValidationCalls, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("ignores unauthorized game:nextPhase requests", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "invalid-host-secret" });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not emit invalid-secret event when client cannot claim control", () => {
  const socketHarness = createSocketHarness();
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(buildRoomState(Phase.SETUP)),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
      }
    }),
    false,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "invalid-host-secret" });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("runs authorized next phase callback without per-socket snapshot emit", () => {
  const socketHarness = createSocketHarness();
  const initialState = buildRoomState(Phase.SETUP);
  const advancedState = buildRoomState(Phase.INTRO, 1);
  const broadcastSnapshots: RoomState[] = [];
  let authorizedCallCount = 0;

  registerRoomStateHandlers(
    socketHarness.socket,
    () => toHostSnapshotEnvelope(initialState),
    createMutationHandlers({
      onAuthorizedNextPhase: () => {
        authorizedCallCount += 1;
        broadcastSnapshots.push(advancedState);
      }
    }),
    true,
    hostAuth
  );

  socketHarness.triggerNextPhase({ hostSecret: "valid-host-secret" });

  assert.equal(authorizedCallCount, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
  assert.deepEqual(broadcastSnapshots, [advancedState]);
});
