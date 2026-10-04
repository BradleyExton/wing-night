import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES, CLIENT_TO_SERVER_EVENTS, Phase } from "@wingnight/shared";

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

test("does not let a display claim control when the socket is seated as DISPLAY", () => {
  const socketHarness = setupHandlers({ clientRole: CLIENT_ROLES.DISPLAY });

  assert.equal(socketHarness.hasListener(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL), false);
  assert.equal(socketHarness.emittedSecretPayloads.length, 0);
});

test("does still answer a display's state request when the socket is seated as DISPLAY", () => {
  const socketHarness = setupHandlers({ clientRole: CLIENT_ROLES.DISPLAY });

  socketHarness.triggerRequestState();

  assert.equal(socketHarness.emittedSnapshots.length, 2);
});

// Defence in depth behind the host secret: a display socket never holds a
// listener for a host mutation or a config call, so there is nothing to probe.
test("does register no host or config listeners when the socket is seated as DISPLAY", () => {
  const socketHarness = setupHandlers({ clientRole: CLIENT_ROLES.DISPLAY });
  const hostOnlyEvents = Object.values(CLIENT_TO_SERVER_EVENTS).filter(
    (event) =>
      event !== CLIENT_TO_SERVER_EVENTS.REQUEST_STATE &&
      event !== CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED
  );

  assert.ok(hostOnlyEvents.includes(CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY));
  for (const event of hostOnlyEvents) {
    assert.equal(socketHarness.hasListener(event), false, event);
  }
  assert.equal(socketHarness.hasListener(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED), true);
});
