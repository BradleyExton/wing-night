import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES } from "@wingnight/shared";

import { resolveSocketAuthPayload, resolveSocketClientRole } from "./index";

test("resolveSocketClientRole maps host route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/host"), CLIENT_ROLES.HOST);
});

// Without this the wizard connects as DISPLAY, canClaimControl is false, no host
// secret is ever issued, and every config:* call is dropped with no reply —
// emitSecretInvalid early-returns for non-claimers, so not even an error arrives.
test("resolveSocketClientRole maps the admin route to HOST role", () => {
  assert.equal(resolveSocketClientRole("/admin"), CLIENT_ROLES.HOST);
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
