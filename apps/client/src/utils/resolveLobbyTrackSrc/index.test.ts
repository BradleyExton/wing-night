import assert from "node:assert/strict";
import test from "node:test";

import { resolveLobbyTrackSrc } from "./index";

const SERVER_ORIGIN = "http://127.0.0.1:3000";

test("builds an absolute url under the lobby-audio route for a plain filename", () => {
  assert.equal(
    resolveLobbyTrackSrc("01-warmup.mp3", SERVER_ORIGIN),
    "http://127.0.0.1:3000/lobby-audio/01-warmup.mp3"
  );
});

// Absolute, never relative: the TV loads the client from a different origin than
// the server that holds the audio, so a root-relative path 404s on the display.
test("percent-encodes a filename with spaces and punctuation", () => {
  assert.equal(
    resolveLobbyTrackSrc("02-hot in herre.mp3", SERVER_ORIGIN),
    "http://127.0.0.1:3000/lobby-audio/02-hot%20in%20herre.mp3"
  );
});
