import assert from "node:assert/strict";
import test from "node:test";

import { resolveAnthemSrc } from "./index";

const SERVER_ORIGIN = "http://127.0.0.1:3000";

test("builds an absolute url under the team-audio route for a plain filename", () => {
  assert.equal(
    resolveAnthemSrc("blaze.mp3", SERVER_ORIGIN),
    "http://127.0.0.1:3000/team-audio/blaze.mp3"
  );
});

test("percent-encodes a filename containing spaces", () => {
  assert.equal(
    resolveAnthemSrc("blaze anthem.mp3", SERVER_ORIGIN),
    "http://127.0.0.1:3000/team-audio/blaze%20anthem.mp3"
  );
});

// The failure this whole seam exists to prevent: a root-relative src resolves
// against the VITE origin, not the server's, and 404s. `new URL(value)` without
// a base throws on a relative string, so this cannot pass for a relative value.
test("returns a value that parses as an absolute url on its own", () => {
  const src = resolveAnthemSrc("blaze.mp3", SERVER_ORIGIN);

  assert.doesNotThrow(() => new URL(src));
  assert.equal(new URL(src).origin, SERVER_ORIGIN);
});

test("keeps the injected origin rather than any ambient one", () => {
  const src = resolveAnthemSrc("blaze.mp3", "https://tv.local:8443");

  assert.equal(new URL(src).origin, "https://tv.local:8443");
});
