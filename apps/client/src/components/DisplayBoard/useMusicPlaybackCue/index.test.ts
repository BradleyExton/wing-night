import assert from "node:assert/strict";
import test from "node:test";

import {
  MUSIC_PLAYBACK_SOURCES,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

import { shouldHoldMusicPosition, shouldPlayMusic } from "./index";

const buildMusic = (
  overrides: Partial<RoomMusicPlaybackState> = {}
): RoomMusicPlaybackState => ({
  source: MUSIC_PLAYBACK_SOURCES.LOBBY,
  trackFileName: "01-first.mp3",
  trackIndex: 0,
  trackCount: 3,
  isPlaying: true,
  ...overrides
});

test("plays when the room state says playing and the display is unlocked", () => {
  assert.equal(shouldPlayMusic(buildMusic(), true), true);
});

// Until someone has tapped the TV the autoplay policy rejects every play() we
// make, so the cue does not pretend otherwise.
test("does not play before the audio unlock tap", () => {
  assert.equal(shouldPlayMusic(buildMusic(), false), false);
});

test("does not play while the host has the music paused", () => {
  assert.equal(shouldPlayMusic(buildMusic({ isPlaying: false }), true), false);
});

test("does not play on a phase that owns no music", () => {
  assert.equal(shouldPlayMusic(null, true), false);
});

// A host pause has to be resumable from where the track was, so a paused track
// holds position while silence rewinds.
test("holds position only while paused music is still the room's track", () => {
  assert.equal(shouldHoldMusicPosition(buildMusic({ isPlaying: false })), true);
  assert.equal(shouldHoldMusicPosition(buildMusic()), false);
  assert.equal(shouldHoldMusicPosition(null), false);
});
