import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, Phase } from "@wingnight/shared";

import {
  buildRoomState,
  setupHandlers,
  toHostSnapshotEnvelope
} from "./testHarness.js";

test("emits state snapshot immediately and on client request", () => {
  const firstState = buildRoomState(Phase.SETUP, 0);

  const socketHarness = setupHandlers({
    getSnapshot: () => toHostSnapshotEnvelope(firstState),
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }
  });

  assert.equal(socketHarness.emittedSnapshots.length, 1);
  assert.deepEqual(socketHarness.emittedSnapshots[0], toHostSnapshotEnvelope(firstState));

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
  assert.deepEqual(socketHarness.emittedSnapshots[1], toHostSnapshotEnvelope(firstState));
});

test("emits host secret when host claims control and socket is authorized", () => {
  const socketHarness = setupHandlers({
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    },
    hostAuth: {
      issueHostSecret: () => ({ hostSecret: "issued-host-secret" }),
      isValidHostSecret: () => false
    }
  });

  socketHarness.triggerHostClaim();

  assert.deepEqual(socketHarness.emittedSecretPayloads, [
    { hostSecret: "issued-host-secret" }
  ]);
});

test("does not emit host secret when socket is not allowed to claim control", () => {
  const socketHarness = setupHandlers({
    canClaimControl: false,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: () => {
        assert.fail("next phase callback should not be called in this test");
      }
    }
  });

  socketHarness.triggerHostClaim();

  assert.equal(socketHarness.emittedSecretPayloads.length, 0);
});
