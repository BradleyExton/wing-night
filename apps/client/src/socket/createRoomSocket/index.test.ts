import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES } from "@wingnight/shared";

import {
  resolvePlayerSocketAuthPayload,
  resolveSocketAuthPayload,
  resolveSocketClientRole
} from "./index";

test("resolveSocketClientRole maps host route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/host"), CLIENT_ROLES.HOST);
});

// Without this the wizard connects as DISPLAY, no host secret is ever issued,
// and every config:* call is dropped with no reply — a display socket has no
// config listener, so not even an error arrives.
test("resolveSocketClientRole maps the admin route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/admin"), CLIENT_ROLES.HOST);
});

// Same failure mode as ADMIN: connected as DISPLAY, the launcher's start would
// be dropped without a reply.
test("resolveSocketClientRole maps the quick play route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/quickplay"), CLIENT_ROLES.HOST);
});

test("resolveSocketAuthPayload includes the host control token for the admin route", () => {
  assert.deepEqual(resolveSocketAuthPayload("/admin", "host-token"), {
    clientRole: CLIENT_ROLES.HOST,
    hostControlToken: "host-token"
  });
});

test("resolveSocketClientRole maps display and dev routes to DISPLAY role", () => {
  assert.equal(resolveSocketClientRole("/display"), CLIENT_ROLES.DISPLAY);
  assert.equal(resolveSocketClientRole("/dev/minigame/trivia"), CLIENT_ROLES.DISPLAY);
});

test("resolveSocketAuthPayload includes host control token for host route only", () => {
  assert.deepEqual(resolveSocketAuthPayload("/host", "host-token"), {
    clientRole: CLIENT_ROLES.HOST,
    hostControlToken: "host-token"
  });

  assert.deepEqual(resolveSocketAuthPayload("/display", "host-token"), {
    clientRole: CLIENT_ROLES.DISPLAY
  });
});

test("resolveSocketAuthPayload omits token when not configured", () => {
  assert.deepEqual(resolveSocketAuthPayload("/host", null), {
    clientRole: CLIENT_ROLES.HOST
  });
});

test("does include the host control token in the auth payload when the route is quick play", () => {
  assert.deepEqual(resolveSocketAuthPayload("/quickplay", "host-token"), {
    clientRole: CLIENT_ROLES.HOST,
    hostControlToken: "host-token"
  });
});

test("does map the phone's play route to the PLAYER role", () => {
  assert.equal(resolveSocketClientRole("/play"), CLIENT_ROLES.PLAYER);
});

test("does send the join token, and the claim secret once there is one, when a phone connects", () => {
  assert.deepEqual(resolvePlayerSocketAuthPayload(null), { clientRole: CLIENT_ROLES.PLAYER });
  assert.deepEqual(
    resolvePlayerSocketAuthPayload({ joinToken: "tok", claimSecret: null, playerId: null }),
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: "tok" }
  );
  assert.deepEqual(
    resolvePlayerSocketAuthPayload({ joinToken: "tok", claimSecret: "sec", playerId: "player-1" }),
    { clientRole: CLIENT_ROLES.PLAYER, joinToken: "tok", claimSecret: "sec" }
  );
});
