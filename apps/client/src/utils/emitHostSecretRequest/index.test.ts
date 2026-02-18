import assert from "node:assert/strict";
import test from "node:test";

import { resolveHostSecretRequest } from "./index";

test("returns null and calls callback when host secret is missing", () => {
  let missingHostSecretCallbackCount = 0;

  const resolvedHostSecret = resolveHostSecretRequest({
    getHostSecret: () => null,
    onMissingHostSecret: () => {
      missingHostSecretCallbackCount += 1;
    }
  });

  assert.equal(resolvedHostSecret, null);
  assert.equal(missingHostSecretCallbackCount, 1);
});

test("returns null when canEmit rejects", () => {
  const resolvedHostSecret = resolveHostSecretRequest({
    getHostSecret: () => "host-secret",
    canEmit: () => false
  });

  assert.equal(resolvedHostSecret, null);
});

test("returns host secret when checks pass", () => {
  const resolvedHostSecret = resolveHostSecretRequest({
    getHostSecret: () => "host-secret"
  });

  assert.equal(resolvedHostSecret, "host-secret");
});
