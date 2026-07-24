import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, Phase, type RoomState } from "@wingnight/shared";

import {
  buildRoomState,
  setupHandlers,
  toHostSnapshotEnvelope
} from "./testHarness.js";

test("ignores malformed game:nextPhase payloads", () => {
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  const socketHarness = setupHandlers({
    getSnapshot: () => toHostSnapshotEnvelope(initialState),
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        authorizedCallCount += 1;
      }
    }
  });

  assert.doesNotThrow(() => {
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, undefined);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, null);
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, {});
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, { hostSecret: 1234 });
    socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, "not-an-object");
  });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not validate host secret for malformed game:nextPhase payloads", () => {
  let hostSecretValidationCalls = 0;

  const socketHarness = setupHandlers({
    hostAuth: {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => {
        hostSecretValidationCalls += 1;
        return false;
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, undefined);
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, null);
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, {});
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, { hostSecret: 1234 });

  assert.equal(hostSecretValidationCalls, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("ignores unauthorized game:nextPhase requests", () => {
  const initialState = buildRoomState(Phase.SETUP);
  let authorizedCallCount = 0;

  const socketHarness = setupHandlers({
    getSnapshot: () => toHostSnapshotEnvelope(initialState),
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        authorizedCallCount += 1;
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, {
    hostSecret: "invalid-host-secret"
  });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
});

test("does not emit invalid-secret event when client cannot claim control", () => {
  let authorizedCallCount = 0;

  const socketHarness = setupHandlers({
    canClaimControl: false,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        authorizedCallCount += 1;
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, {
    hostSecret: "invalid-host-secret"
  });

  assert.equal(authorizedCallCount, 0);
  assert.equal(socketHarness.invalidSecretEvents, 0);
});

test("runs authorized next phase callback without per-socket snapshot emit", () => {
  const initialState = buildRoomState(Phase.SETUP);
  const advancedState = buildRoomState(Phase.INTRO, 1);
  const broadcastSnapshots: RoomState[] = [];
  let authorizedCallCount = 0;

  const socketHarness = setupHandlers({
    getSnapshot: () => toHostSnapshotEnvelope(initialState),
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        authorizedCallCount += 1;
        broadcastSnapshots.push(advancedState);
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.NEXT_PHASE, {
    hostSecret: "valid-host-secret"
  });

  assert.equal(authorizedCallCount, 1);
  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(initialState));
  assert.deepEqual(broadcastSnapshots, [advancedState]);
});
