import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES, CLIENT_TO_SERVER_EVENTS, Phase } from "@wingnight/shared";

import { setupHandlers } from "./testHarness.js";

const HOST_ONLY_EVENTS = Object.values(CLIENT_TO_SERVER_EVENTS).filter(
  (event) =>
    event !== CLIENT_TO_SERVER_EVENTS.REQUEST_STATE &&
    event !== CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM &&
    event !== CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE
);

// A phone may read the room and nothing else here: the phone family is
// registered beside this by registerPlayerHandlers, and no host listener —
// not even the claim for a host secret — exists on its socket to probe.
test("does give a PLAYER socket the state request and no host or display listener", () => {
  for (const isLoopbackPeer of [false, true]) {
    const socketHarness = setupHandlers({ clientRole: CLIENT_ROLES.PLAYER, isLoopbackPeer });

    assert.equal(socketHarness.hasListener(CLIENT_TO_SERVER_EVENTS.REQUEST_STATE), true);

    for (const event of HOST_ONLY_EVENTS) {
      assert.equal(socketHarness.hasListener(event), false, event);
    }
  }
});

test("does keep the phone family off HOST and DISPLAY sockets", () => {
  for (const clientRole of [CLIENT_ROLES.HOST, CLIENT_ROLES.DISPLAY]) {
    const socketHarness = setupHandlers({ clientRole });

    assert.equal(socketHarness.hasListener(CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM), false);
    assert.equal(socketHarness.hasListener(CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE), false);
  }
});

test("does release a player claim only for the host and only with a player id", () => {
  const releasedPlayerIds: string[] = [];
  const socketHarness = setupHandlers({
    phase: Phase.MINIGAME_PLAY,
    overrides: {
      [CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM]: (payload) => {
        releasedPlayerIds.push(payload.playerId);
      }
    }
  });

  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM, undefined);
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM, {
    hostSecret: "valid-host-secret"
  });
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM, {
    hostSecret: "invalid-host-secret",
    playerId: "player-1"
  });
  socketHarness.trigger(CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM, {
    hostSecret: "valid-host-secret",
    playerId: "player-1"
  });

  assert.deepEqual(releasedPlayerIds, ["player-1"]);
  assert.equal(socketHarness.invalidSecretEvents, 1);
  assert.equal(
    setupHandlers({ clientRole: CLIENT_ROLES.DISPLAY }).hasListener(
      CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM
    ),
    false
  );
});
