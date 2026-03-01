import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_ROLES } from "@wingnight/shared";

import {
  resolveAuthorizedSocketClientRole,
  resolveConfiguredHostControlToken
} from "./index.js";

test("resolveConfiguredHostControlToken trims and rejects empty strings", () => {
  assert.equal(resolveConfiguredHostControlToken(undefined), null);
  assert.equal(resolveConfiguredHostControlToken(""), null);
  assert.equal(resolveConfiguredHostControlToken("   "), null);
  assert.equal(resolveConfiguredHostControlToken("  token-123  "), "token-123");
});

test("allows display clients without host token or loopback checks", () => {
  const resolvedRole = resolveAuthorizedSocketClientRole(
    {
      clientRole: CLIENT_ROLES.DISPLAY
    },
    "198.51.100.23",
    "room-token"
  );

  assert.equal(resolvedRole, CLIENT_ROLES.DISPLAY);
});

test("requires valid host control token when HOST_CONTROL_TOKEN is configured", () => {
  const authorizedRole = resolveAuthorizedSocketClientRole(
    {
      clientRole: CLIENT_ROLES.HOST,
      hostControlToken: "valid-room-token"
    },
    "198.51.100.23",
    "valid-room-token"
  );

  const unauthorizedRole = resolveAuthorizedSocketClientRole(
    {
      clientRole: CLIENT_ROLES.HOST,
      hostControlToken: "invalid-room-token"
    },
    "127.0.0.1",
    "valid-room-token"
  );

  assert.equal(authorizedRole, CLIENT_ROLES.HOST);
  assert.equal(unauthorizedRole, CLIENT_ROLES.DISPLAY);
});

test("falls back to loopback-only host authorization when token is not configured", () => {
  const localHostRole = resolveAuthorizedSocketClientRole(
    {
      clientRole: CLIENT_ROLES.HOST
    },
    "::1",
    null
  );

  const remoteHostRole = resolveAuthorizedSocketClientRole(
    {
      clientRole: CLIENT_ROLES.HOST
    },
    "203.0.113.20",
    null
  );

  assert.equal(localHostRole, CLIENT_ROLES.HOST);
  assert.equal(remoteHostRole, CLIENT_ROLES.DISPLAY);
});

test("treats malformed auth payloads as display clients", () => {
  assert.equal(resolveAuthorizedSocketClientRole(null, "::1", null), CLIENT_ROLES.DISPLAY);
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: "HACKER" }, "::1", null),
    CLIENT_ROLES.DISPLAY
  );
  assert.equal(
    resolveAuthorizedSocketClientRole({ clientRole: CLIENT_ROLES.HOST }, undefined, null),
    CLIENT_ROLES.DISPLAY
  );
});
