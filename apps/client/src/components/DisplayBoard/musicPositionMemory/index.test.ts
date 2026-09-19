import assert from "node:assert/strict";
import test from "node:test";

import { MUSIC_PLAYBACK_SOURCES } from "@wingnight/shared";

import {
  buildMusicPositionKey,
  forgetMusicPosition,
  readMusicPosition,
  rememberMusicPosition,
  resolveResumeSeconds
} from "./index";

const createBackend = (
  seed: Record<string, string> = {}
): Pick<Storage, "getItem" | "setItem"> => {
  const store = new Map(Object.entries(seed));

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    }
  };
};

const KEY = buildMusicPositionKey(MUSIC_PLAYBACK_SOURCES.ANTHEM, "blaze.mp3");

test("keys a position by source and filename so a lobby track and an anthem never collide", () => {
  assert.notEqual(
    buildMusicPositionKey(MUSIC_PLAYBACK_SOURCES.LOBBY, "fire.mp3"),
    buildMusicPositionKey(MUSIC_PLAYBACK_SOURCES.ANTHEM, "fire.mp3")
  );
});

test("remembers a position and reads it back", () => {
  const backend = createBackend();

  rememberMusicPosition(KEY, 42.5, backend);

  assert.equal(readMusicPosition(KEY, backend), 42.5);
});

test("reads null for a track it has never seen", () => {
  assert.equal(readMusicPosition(KEY, createBackend()), null);
});

test("forgets a position so a finished track starts from the top next time", () => {
  const backend = createBackend();

  rememberMusicPosition(KEY, 42.5, backend);
  forgetMusicPosition(KEY, backend);

  assert.equal(readMusicPosition(KEY, backend), null);
});

test("keeps the other tracks when one is remembered or forgotten", () => {
  const backend = createBackend();
  const otherKey = buildMusicPositionKey(MUSIC_PLAYBACK_SOURCES.LOBBY, "01-a.mp3");

  rememberMusicPosition(otherKey, 10, backend);
  rememberMusicPosition(KEY, 20, backend);
  forgetMusicPosition(KEY, backend);

  assert.equal(readMusicPosition(otherKey, backend), 10);
});

test("ignores a negative or non-finite position", () => {
  const backend = createBackend();

  rememberMusicPosition(KEY, -1, backend);
  rememberMusicPosition(KEY, Number.NaN, backend);

  assert.equal(readMusicPosition(KEY, backend), null);
});

// Anything a kiosk, an extension or a previous build left in the slot is
// treated as no memory rather than a crash on the TV.
test("treats corrupt storage as empty", () => {
  assert.equal(
    readMusicPosition(KEY, createBackend({ "wingnight.musicPositions": "{nope" })),
    null
  );
  assert.equal(
    readMusicPosition(KEY, createBackend({ "wingnight.musicPositions": "[1,2]" })),
    null
  );
  assert.equal(
    readMusicPosition(
      KEY,
      createBackend({ "wingnight.musicPositions": JSON.stringify({ [KEY]: "42" }) })
    ),
    null
  );
});

test("plays from the top with no storage at all", () => {
  assert.equal(readMusicPosition(KEY, null), null);
  assert.doesNotThrow(() => rememberMusicPosition(KEY, 5, null));
  assert.doesNotThrow(() => forgetMusicPosition(KEY, null));
});

test("resumes at the remembered position when it sits well inside the track", () => {
  assert.equal(resolveResumeSeconds(45, 200), 45);
});

test("starts over when the remembered position is in the track's tail", () => {
  assert.equal(resolveResumeSeconds(195, 200), 0);
  assert.equal(resolveResumeSeconds(199, 200), 0);
});

test("starts from the top with nothing remembered", () => {
  assert.equal(resolveResumeSeconds(null, 200), 0);
});

// The element reports NaN for its duration until metadata loads; the
// remembered position is trusted meanwhile and re-checked once it is known.
test("trusts the remembered position while the duration is still unknown", () => {
  assert.equal(resolveResumeSeconds(45, Number.NaN), 45);
});
