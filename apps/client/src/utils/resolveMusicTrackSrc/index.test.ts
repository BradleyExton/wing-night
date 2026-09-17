import assert from "node:assert/strict";
import test from "node:test";

import { MUSIC_PLAYBACK_SOURCES } from "@wingnight/shared";

import { resolveMusicTrackSrc } from "./index";

const SERVER_ORIGIN = "http://192.168.1.50:3000";

test("routes a lobby track to the lobby audio path", () => {
  assert.equal(
    resolveMusicTrackSrc(MUSIC_PLAYBACK_SOURCES.LOBBY, "01-warmup.mp3", SERVER_ORIGIN),
    `${SERVER_ORIGIN}/lobby-audio/01-warmup.mp3`
  );
});

test("routes an anthem to the team audio path", () => {
  assert.equal(
    resolveMusicTrackSrc(MUSIC_PLAYBACK_SOURCES.ANTHEM, "blaze.mp3", SERVER_ORIGIN),
    `${SERVER_ORIGIN}/team-audio/blaze.mp3`
  );
});

// The two sources must never collide on a filename a host used in both places.
test("resolves different urls for the same filename on different sources", () => {
  assert.notEqual(
    resolveMusicTrackSrc(MUSIC_PLAYBACK_SOURCES.LOBBY, "same.mp3", SERVER_ORIGIN),
    resolveMusicTrackSrc(MUSIC_PLAYBACK_SOURCES.ANTHEM, "same.mp3", SERVER_ORIGIN)
  );
});

test("percent-encodes a filename with spaces on either source", () => {
  assert.equal(
    resolveMusicTrackSrc(MUSIC_PLAYBACK_SOURCES.LOBBY, "hot in herre.mp3", SERVER_ORIGIN),
    `${SERVER_ORIGIN}/lobby-audio/hot%20in%20herre.mp3`
  );
});
