import assert from "node:assert/strict";
import test from "node:test";

import { isValidHostSecret, issueHostSecret } from "./index.js";

test("issued host secret is valid", () => {
  const { hostSecret } = issueHostSecret();

  assert.equal(isValidHostSecret(hostSecret), true);
});

test("issuing a new host secret invalidates prior secret", () => {
  const firstSecret = issueHostSecret().hostSecret;
  const secondSecret = issueHostSecret().hostSecret;

  assert.equal(isValidHostSecret(firstSecret), false);
  assert.equal(isValidHostSecret(secondSecret), true);
});

test("invalid host secret values return false", () => {
  issueHostSecret();

  assert.equal(isValidHostSecret(""), false);
  assert.equal(isValidHostSecret("   "), false);
});
