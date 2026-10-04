import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";

import { hashToken, isTokenShaped, mintGuestId, mintToken, secretsMatch } from "./index.ts";

const random = (byteCount: number): Uint8Array => new Uint8Array(randomBytes(byteCount));

test("does mint 32 random bytes as unpadded base64url when a token is minted", () => {
  const token = mintToken(random);

  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(Buffer.from(token, "base64url").length, 32);
  assert.notEqual(mintToken(random), token);
  assert.ok(isTokenShaped(token));
});

test("does produce the SHA-256 hex of its text when a token is hashed", async () => {
  const token = mintToken(random);

  assert.equal(await hashToken(token), createHash("sha256").update(token).digest("hex"));
});

test("does prefix a guest id and keep it url-safe when one is minted", () => {
  assert.match(mintGuestId(random), /^g_[A-Za-z0-9_-]{16}$/);
});

test("does match two secrets only when they are identical", async () => {
  assert.equal(await secretsMatch("open-sesame", "open-sesame"), true);
  assert.equal(await secretsMatch("open-sesamE", "open-sesame"), false);
  assert.equal(await secretsMatch("open", "open-sesame"), false);
  assert.equal(await secretsMatch("", "open-sesame"), false);
});

test("does refuse a path segment as a token when it is short or not base64url", () => {
  assert.equal(isTokenShaped("x"), false);
  assert.equal(isTokenShaped("a".repeat(20) + "/"), false);
  assert.equal(isTokenShaped("a".repeat(129)), false);
});
