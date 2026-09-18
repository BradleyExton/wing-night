import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_ASSET_ROUTE_PATH, resolveContentAssetSrc } from "./index.js";

test("resolves a pack-relative path against the server origin when an origin is known", () => {
  assert.equal(
    resolveContentAssetSrc("avatars/rob.png", "http://192.168.1.20:3000"),
    `http://192.168.1.20:3000${CONTENT_ASSET_ROUTE_PATH}/avatars/rob.png`
  );
});

// The client is always a different origin from the server (there is no dev
// proxy), so a pack-relative path rendered before the origin is known would
// 404 against Vite. The surface renders media-less for that one paint instead.
test("returns null for a pack-relative path when the server origin is not known yet", () => {
  assert.equal(resolveContentAssetSrc("avatars/rob.png", null), null);
});

test("returns null for a pack-relative path when the server origin is blank", () => {
  assert.equal(resolveContentAssetSrc("avatars/rob.png", "   "), null);
});

// The sample pack's placeholder art is committed under the client's public/
// directory and served by Vite, so it is already a correct URL as authored.
test("leaves a root-relative sample asset path alone", () => {
  assert.equal(
    resolveContentAssetSrc("/sample-assets/geo/eiffel-tower.svg", "http://localhost:3000"),
    "/sample-assets/geo/eiffel-tower.svg"
  );
});

test("leaves an absolute url alone", () => {
  assert.equal(
    resolveContentAssetSrc("https://example.com/head.png", "http://localhost:3000"),
    "https://example.com/head.png"
  );
});

test("leaves a data url alone", () => {
  assert.equal(
    resolveContentAssetSrc("data:image/png;base64,AAAA", null),
    "data:image/png;base64,AAAA"
  );
});

// Pack paths are a directory plus a file name, and party photo filenames carry
// spaces and apostrophes routinely.
test("encodes each path segment but keeps the separators", () => {
  assert.equal(
    resolveContentAssetSrc("geo/jo's birthday.jpg", "http://localhost:3000"),
    `http://localhost:3000${CONTENT_ASSET_ROUTE_PATH}/geo/jo's%20birthday.jpg`
  );
});

test("returns null when the asset path is blank", () => {
  assert.equal(resolveContentAssetSrc("   ", "http://localhost:3000"), null);
});
