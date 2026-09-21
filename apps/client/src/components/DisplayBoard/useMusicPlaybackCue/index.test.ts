import assert from "node:assert/strict";
import test from "node:test";

import {
  MUSIC_PLAYBACK_SOURCES,
  type RoomMusicPlaybackState
} from "@wingnight/shared";

import {
  shouldFadeOutFirst,
  shouldHoldMusicPosition,
  shouldPlayMusic,
  shouldLoopTrack,
  shouldRememberPosition,
  shouldSeekToRememberedPosition
} from "./index";

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

// The fade exists for the speaker, so only an audible element earns one. A
// silent element — before the unlock tap, or already paused — swaps its file
// and stops instantly, which is what keeps "src is set before the tap" true.
test("fades out first only when audible music is being silenced or swapped", () => {
  assert.equal(shouldFadeOutFirst(true, true, true), true);
  assert.equal(shouldFadeOutFirst(true, false, false), true);
  assert.equal(shouldFadeOutFirst(true, false, true), false);
  assert.equal(shouldFadeOutFirst(false, true, true), false);
  assert.equal(shouldFadeOutFirst(false, false, false), false);
});

// A resume from a host pause keeps the element's own position; only a track
// starting from the top consults the memory.
test("seeks to the remembered position only when starting from the top", () => {
  assert.equal(shouldSeekToRememberedPosition(0), true);
  assert.equal(shouldSeekToRememberedPosition(0.2), true);
  assert.equal(shouldSeekToRememberedPosition(12), false);
});

// The pre-unlock stop and the tap's own rewind both leave the element at 0;
// writing that would erase the position the memory exists to keep.
test("remembers a position only once the track is actually under way", () => {
  assert.equal(shouldRememberPosition(0), false);
  assert.equal(shouldRememberPosition(0.3), false);
  assert.equal(shouldRememberPosition(0.5), true);
  assert.equal(shouldRememberPosition(90), true);
});

// The lobby's one-track case is the only thing the element repeats on its own:
// the server's cursor wraps to the track already playing, so no snapshot comes
// and nothing else would ever restart it.
test("loops the lobby when the playlist holds a single track", () => {
  assert.equal(shouldLoopTrack(buildMusic({ trackCount: 1 })), true);
});

test("does not loop a lobby playlist the server can advance through", () => {
  assert.equal(shouldLoopTrack(buildMusic({ trackCount: 3 })), false);
});

// An anthem is a one-shot cue however short the team's list: it ends, the
// server marks it stopped, and the room is quiet until the next phase.
test("never loops an anthem, even a team's only one", () => {
  assert.equal(
    shouldLoopTrack(
      buildMusic({ source: MUSIC_PLAYBACK_SOURCES.ANTHEM, trackCount: 1 })
    ),
    false
  );
});

test("does not loop when the room has no music playing", () => {
  assert.equal(shouldLoopTrack(null), false);
});
