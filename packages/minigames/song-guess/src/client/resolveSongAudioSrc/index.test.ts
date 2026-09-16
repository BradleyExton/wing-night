import assert from "node:assert/strict";
import test from "node:test";

import { resolveSongAudioSrc } from "./index.js";

test("builds an absolute url against the injected server origin", () => {
  assert.equal(
    resolveSongAudioSrc("creep.mp3", "http://192.168.1.20:3000"),
    "http://192.168.1.20:3000/song-audio/creep.mp3"
  );
});

// The client is ALWAYS a different origin from the server (no dev proxy), so a
// root-relative src would resolve against Vite and 404 on the TV.
test("never returns a root-relative url", () => {
  assert.doesNotMatch(
    resolveSongAudioSrc("creep.mp3", "http://localhost:3000"),
    /^\//
  );
});

test("percent-encodes filenames carrying spaces", () => {
  assert.equal(
    resolveSongAudioSrc("don't stop believin'.mp3", "http://host:3000"),
    "http://host:3000/song-audio/don't%20stop%20believin'.mp3"
  );
});

test("encodes a filename that would otherwise change the request path", () => {
  assert.equal(
    resolveSongAudioSrc("a/b.mp3", "http://host:3000"),
    "http://host:3000/song-audio/a%2Fb.mp3"
  );
});
