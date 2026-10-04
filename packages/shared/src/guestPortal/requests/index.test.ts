import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdminCreateGuestRequest,
  isAdminEditGuestRequest,
  isEmailLinkRequest,
  normalizeGuestDisplayName,
  normalizeGuestEmail
} from "./index.js";

test("does trim and lower-case an address when it is normalized", () => {
  assert.equal(normalizeGuestEmail("  Rob@Example.COM "), "rob@example.com");
  assert.equal(normalizeGuestEmail("not-an-address"), null);
  assert.equal(normalizeGuestEmail(42), null);
});

test("does collapse whitespace and refuse an empty or overlong name when it is normalized", () => {
  assert.equal(normalizeGuestDisplayName("  Big   Rob "), "Big Rob");
  assert.equal(normalizeGuestDisplayName("   "), null);
  assert.equal(normalizeGuestDisplayName("x".repeat(41)), null);
});

test("does accept an email-link request only when it carries an address", () => {
  assert.equal(isEmailLinkRequest({ email: "rob@example.com" }), true);
  assert.equal(isEmailLinkRequest({ email: "rob" }), false);
  assert.equal(isEmailLinkRequest({}), false);
});

test("does accept a new guest with or without an address when the name is real", () => {
  assert.equal(isAdminCreateGuestRequest({ displayName: "Rob", email: null }), true);
  assert.equal(isAdminCreateGuestRequest({ displayName: "Rob", email: "rob@example.com" }), true);
  assert.equal(isAdminCreateGuestRequest({ displayName: "", email: null }), false);
  assert.equal(isAdminCreateGuestRequest({ displayName: "Rob" }), false);
});

test("does accept an edit when it changes at least one valid field", () => {
  assert.equal(isAdminEditGuestRequest({ displayName: "Robert" }), true);
  assert.equal(isAdminEditGuestRequest({ email: null }), true);
  assert.equal(isAdminEditGuestRequest({}), false);
  assert.equal(isAdminEditGuestRequest({ email: "nope" }), false);
});
