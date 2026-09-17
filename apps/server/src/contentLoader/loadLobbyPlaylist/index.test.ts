import assert from "node:assert/strict";
import test from "node:test";

import { loadLobbyPlaylist } from "./index.js";
import { createContentRoot, writeContentFile } from "../testHarness.js";

const seedLobbyAudio = (fileNames: string[]): string => {
  const contentRoot = createContentRoot();

  for (const fileName of fileNames) {
    writeContentFile(contentRoot, `local/audio/lobby/${fileName}`, "mp3-bytes");
  }

  return contentRoot;
};

test("orders the playlist by filename so numeric prefixes control playback order", () => {
  const contentRootDir = seedLobbyAudio([
    "03-third.mp3",
    "01-first.mp3",
    "02-second.mp3"
  ]);

  assert.deepEqual(loadLobbyPlaylist({ contentRootDir }), [
    "01-first.mp3",
    "02-second.mp3",
    "03-third.mp3"
  ]);
});

test("ignores non-mp3 files sitting in the lobby directory", () => {
  const contentRootDir = seedLobbyAudio(["01-track.mp3", "notes.txt", ".DS_Store"]);

  assert.deepEqual(loadLobbyPlaylist({ contentRootDir }), ["01-track.mp3"]);
});

// The extension case is whatever the host's downloader produced, not something
// they should have to rename.
test("keeps a track whose extension is uppercase", () => {
  const contentRootDir = seedLobbyAudio(["01-Track.MP3"]);

  assert.deepEqual(loadLobbyPlaylist({ contentRootDir }), ["01-Track.MP3"]);
});

// The default state of a fresh clone: no `content/local/` at all. A party must
// boot without lobby music, silently.
test("returns an empty playlist when the lobby directory is missing", () => {
  const contentRootDir = createContentRoot();

  assert.deepEqual(loadLobbyPlaylist({ contentRootDir }), []);
});
