import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES } from "@wingnight/shared";

import { resolveAuthorizedSocketClientRole } from "./index.js";

// What the laptop is (address, Host, Origin) is `isLoopbackPeer`'s question and
// is tested there and through the seat guard; this is the seating rule on top.
const HOST_CONTROL_TOKEN = "room-token";
const ON_LAPTOP = true;
const ON_LAN = false;

test("does seat a display when it asks for DISPLAY from anywhere", () => {
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.DISPLAY }, ON_LAN, HOST_CONTROL_TOKEN),
    CLIENT_ROLES.DISPLAY
  );
});

test("does deny HOST when a LAN peer brings no token", () => {
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.HOST }, ON_LAN, HOST_CONTROL_TOKEN),
    null
  );
});

test("does deny HOST when a LAN peer brings the wrong token", () => {
  for (const hostControlToken of ["wrong-token", "room-toke", "", 42]) {
    assert.equal(
      resolveAuthorizedSocketClientRole(
        { clientRole: CLIENT_ROLES.HOST, hostControlToken },
        ON_LAN,
        HOST_CONTROL_TOKEN
      ),
      null
    );
  }
});

test("does grant HOST when a LAN peer brings the right token", () => {
  assert.equal(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.HOST, hostControlToken: HOST_CONTROL_TOKEN },
      ON_LAN,
      HOST_CONTROL_TOKEN
    ),
    CLIENT_ROLES.HOST
  );
});

test("does grant HOST when the peer is the laptop and no token is sent", () => {
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.HOST }, ON_LAPTOP, HOST_CONTROL_TOKEN),
    CLIENT_ROLES.HOST
  );
});

// A laptop tab holding a token that was since rotated must still get in.
test("does grant HOST when the peer is the laptop and the token is stale", () => {
  assert.equal(
    resolveAuthorizedSocketClientRole(
      { clientRole: CLIENT_ROLES.HOST, hostControlToken: "rotated-token" },
      ON_LAPTOP,
      HOST_CONTROL_TOKEN
    ),
    CLIENT_ROLES.HOST
  );
});

test("does fall back to DISPLAY when the role is malformed or unknown", () => {
  assert.equal(resolveAuthorizedSocketClientRole(null, ON_LAN, HOST_CONTROL_TOKEN), CLIENT_ROLES.DISPLAY);
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: "HACKER" }, ON_LAN, HOST_CONTROL_TOKEN),
    CLIENT_ROLES.DISPLAY
  );
  assert.equal(resolveAuthorizedSocketClientRole({}, ON_LAPTOP, HOST_CONTROL_TOKEN), CLIENT_ROLES.DISPLAY);
});
