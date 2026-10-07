import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_ROLES,
  HOST_AUTH_REQUIRED_ERROR_CODE,
  PLAYER_AUTH_REQUIRED_ERROR_CODE
} from "@wingnight/shared";

import { resolveAuthorizedSocketClientRole, type SeatCredentials } from "./index.js";

// What the laptop is (address, Host, Origin) is `isLoopbackPeer`'s question and
// is tested there and through the seat guard; this is the seating rule on top.
const CREDENTIALS: SeatCredentials = {
  hostControlToken: "room-token",
  isPlayerJoinToken: (joinToken) => joinToken === "join-token",
  isPlayerClaimSecret: (claimSecret) => claimSecret === "held-secret"
};
const ON_LAPTOP = true;
const ON_LAN = false;
const HOST_REFUSED = { seated: false, errorCode: HOST_AUTH_REQUIRED_ERROR_CODE };
const PLAYER_REFUSED = { seated: false, errorCode: PLAYER_AUTH_REQUIRED_ERROR_CODE };

const seatedAs = (clientRole: string) => ({ seated: true, clientRole });

test("does seat a display when it asks for DISPLAY from anywhere", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.DISPLAY }, ON_LAN, CREDENTIALS),
    seatedAs(CLIENT_ROLES.DISPLAY)
  );
});

test("does deny HOST when a LAN peer brings no token", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.HOST }, ON_LAN, CREDENTIALS),
    HOST_REFUSED
  );
});

test("does deny HOST when a LAN peer brings the wrong token", () => {
  for (const hostControlToken of ["wrong-token", "room-toke", "", 42, "join-token"]) {
    assert.deepEqual(
      resolveAuthorizedSocketClientRole(
        { clientRole: CLIENT_ROLES.HOST, hostControlToken },
        ON_LAN,
        CREDENTIALS
      ),
      HOST_REFUSED
    );
  }
});

test("does grant HOST when a LAN peer brings the right token", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.HOST, hostControlToken: "room-token" },
      ON_LAN,
      CREDENTIALS
    ),
    seatedAs(CLIENT_ROLES.HOST)
  );
});

test("does grant HOST when the peer is the laptop and no token is sent", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.HOST }, ON_LAPTOP, CREDENTIALS),
    seatedAs(CLIENT_ROLES.HOST)
  );
});

// A laptop tab holding a token that was since rotated must still get in.
test("does grant HOST when the peer is the laptop and the token is stale", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.HOST, hostControlToken: "rotated-token" },
      ON_LAPTOP,
      CREDENTIALS
    ),
    seatedAs(CLIENT_ROLES.HOST)
  );
});

test("does fall back to DISPLAY when the role is malformed or unknown", () => {
  assert.deepEqual(resolveAuthorizedSocketClientRole(null, ON_LAN, CREDENTIALS), seatedAs(CLIENT_ROLES.DISPLAY));
  assert.deepEqual(
    resolveAuthorizedSocketClientRole({ clientRole: "HACKER" }, ON_LAN, CREDENTIALS),
    seatedAs(CLIENT_ROLES.DISPLAY)
  );
  assert.deepEqual(resolveAuthorizedSocketClientRole({}, ON_LAPTOP, CREDENTIALS), seatedAs(CLIENT_ROLES.DISPLAY));
});

test("does seat a PLAYER when the phone brings the current join token", () => {
  for (const isLoopbackPeer of [ON_LAN, ON_LAPTOP]) {
    assert.deepEqual(
      resolveAuthorizedSocketClientRole(
        { clientRole: CLIENT_ROLES.PLAYER, joinToken: "join-token" },
        isLoopbackPeer,
        CREDENTIALS
      ),
      seatedAs(CLIENT_ROLES.PLAYER)
    );
  }
});

// Refused, never downgraded: a phone seated as a display would show the TV's
// board with no word about the scan it needs.
test("does refuse PLAYER and not downgrade it when the join token is missing or wrong", () => {
  for (const auth of [
    { clientRole: CLIENT_ROLES.PLAYER },
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: "stale-token" },
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: 7 },
    { clientRole: CLIENT_ROLES.PLAYER, hostControlToken: "room-token" }
  ]) {
    assert.deepEqual(resolveAuthorizedSocketClientRole(auth, ON_LAN, CREDENTIALS), PLAYER_REFUSED);
  }

  // The laptop is not a pass for a phone the way it is for the host.
  assert.deepEqual(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.PLAYER }, ON_LAPTOP, CREDENTIALS),
    PLAYER_REFUSED
  );
});

// The host printed a new code: the phones already holding faces come back on
// their claim secret; a stale code with no live secret is still refused.
test("does seat a PLAYER on a live claim secret when its join token was rotated", () => {
  assert.deepEqual(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: "old-token", claimSecret: "held-secret" },
      ON_LAN,
      CREDENTIALS
    ),
    seatedAs(CLIENT_ROLES.PLAYER)
  );
  assert.deepEqual(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.PLAYER, joinToken: "old-token", claimSecret: "freed-secret" },
      ON_LAN,
      CREDENTIALS
    ),
    PLAYER_REFUSED
  );
});
