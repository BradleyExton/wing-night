import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MUSIC_PLAYBACK_SOURCES, Phase } from "@wingnight/shared";

import {
  getRoomStateSnapshot,
  pauseRoomMusic,
  reportRoomMusicTrackEnded,
  resetRoomState,
  resumeRoomMusic,
  setRoomStateLobbyPlaylist,
  setRoomStateTeams,
  skipRoomMusicTrack
} from "../index.js";
import { advanceUntil, setupValidTeamsAndAssignments } from "../testHarness.js";

const LOBBY_PLAYLIST = ["01-first.mp3", "02-second.mp3", "03-third.mp3"];

beforeEach(() => {
  resetRoomState();
});

const seedLobbyPlaylist = (playlist: string[] = LOBBY_PLAYLIST): void => {
  setRoomStateLobbyPlaylist(playlist);
};

// Anthems reach the active team the way the content loader seats them.
const seedTeamsWithAnthems = (): void => {
  setupValidTeamsAndAssignments();
  const teams = getRoomStateSnapshot().teams;

  setRoomStateTeams(
    teams.map((team, index) =>
      index === 0
        ? { ...team, anthems: ["blaze-one.mp3", "blaze-two.mp3"] }
        : team
    )
  );
};

test("starts the lobby playlist at SETUP when the playlist is seeded at boot", () => {
  seedLobbyPlaylist();

  assert.deepEqual(getRoomStateSnapshot().musicPlayback, {
    source: MUSIC_PLAYBACK_SOURCES.LOBBY,
    trackFileName: "01-first.mp3",
    trackIndex: 0,
    trackCount: 3,
    isPlaying: true
  });
});

test("leaves the music silent at SETUP when no lobby tracks exist", () => {
  seedLobbyPlaylist([]);

  assert.equal(getRoomStateSnapshot().musicPlayback, null);
});

test("pauses and resumes the lobby playlist without moving the cursor", () => {
  seedLobbyPlaylist();

  pauseRoomMusic();
  const paused = getRoomStateSnapshot().musicPlayback;

  assert.equal(paused?.isPlaying, false);
  assert.equal(paused?.trackIndex, 0);

  resumeRoomMusic();
  const resumed = getRoomStateSnapshot().musicPlayback;

  assert.equal(resumed?.isPlaying, true);
  assert.equal(resumed?.trackIndex, 0);
});

test("skips to the next lobby track and names it", () => {
  seedLobbyPlaylist();

  skipRoomMusicTrack();

  assert.deepEqual(getRoomStateSnapshot().musicPlayback, {
    source: MUSIC_PLAYBACK_SOURCES.LOBBY,
    trackFileName: "02-second.mp3",
    trackIndex: 1,
    trackCount: 3,
    isPlaying: true
  });
});

test("wraps the lobby cursor to the top when skipping past the last track", () => {
  seedLobbyPlaylist();

  skipRoomMusicTrack();
  skipRoomMusicTrack();
  skipRoomMusicTrack();

  assert.equal(getRoomStateSnapshot().musicPlayback?.trackIndex, 0);
});

// Skip implies play: a host tapping Next on paused music wants it playing.
test("resumes playback when skipping while paused", () => {
  seedLobbyPlaylist();

  pauseRoomMusic();
  skipRoomMusicTrack();

  assert.equal(getRoomStateSnapshot().musicPlayback?.isPlaying, true);
});

test("advances the lobby playlist when the display reports the track ended", () => {
  seedLobbyPlaylist();

  reportRoomMusicTrackEnded(MUSIC_PLAYBACK_SOURCES.LOBBY, 0);

  assert.equal(getRoomStateSnapshot().musicPlayback?.trackIndex, 1);
});

// A display that reconnected mid-track, or a second display, reports a track
// the room has already moved past. The report names its track precisely so
// those land as no-ops rather than double-skips.
test("ignores a track-ended report that names a track no longer playing", () => {
  seedLobbyPlaylist();

  reportRoomMusicTrackEnded(MUSIC_PLAYBACK_SOURCES.LOBBY, 2);

  assert.equal(getRoomStateSnapshot().musicPlayback?.trackIndex, 0);
});

test("ignores a track-ended report naming the wrong source", () => {
  seedLobbyPlaylist();

  reportRoomMusicTrackEnded(MUSIC_PLAYBACK_SOURCES.ANTHEM, 0);

  assert.equal(getRoomStateSnapshot().musicPlayback?.trackIndex, 0);
});

test("ignores a track-ended report while the music is paused", () => {
  seedLobbyPlaylist();

  pauseRoomMusic();
  reportRoomMusicTrackEnded(MUSIC_PLAYBACK_SOURCES.LOBBY, 0);

  assert.equal(getRoomStateSnapshot().musicPlayback?.trackIndex, 0);
});

test("plays the active team's round anthem at MINIGAME_INTRO", () => {
  seedLobbyPlaylist();
  seedTeamsWithAnthems();
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  assert.deepEqual(getRoomStateSnapshot().musicPlayback, {
    source: MUSIC_PLAYBACK_SOURCES.ANTHEM,
    trackFileName: "blaze-one.mp3",
    trackIndex: 0,
    trackCount: 2,
    isPlaying: true
  });
});

test("silences the music on a phase that owns no music", () => {
  seedLobbyPlaylist();
  seedTeamsWithAnthems();
  advanceUntil(Phase.EATING, 1);

  assert.equal(getRoomStateSnapshot().musicPlayback, null);
});

// An anthem is a one-shot cue. Advancing to the team's next anthem here would
// break the round-keyed rotation a display refresh depends on.
test("stops rather than advancing when an anthem ends", () => {
  seedLobbyPlaylist();
  seedTeamsWithAnthems();
  advanceUntil(Phase.MINIGAME_INTRO, 1);

  reportRoomMusicTrackEnded(MUSIC_PLAYBACK_SOURCES.ANTHEM, 0);
  const music = getRoomStateSnapshot().musicPlayback;

  assert.equal(music?.isPlaying, false);
  assert.equal(music?.trackIndex, 0);
});

test("restores the lobby playlist when Reset Game returns the room to SETUP", () => {
  seedLobbyPlaylist();
  seedTeamsWithAnthems();
  advanceUntil(Phase.EATING, 1);
  assert.equal(getRoomStateSnapshot().musicPlayback, null);

  resetRoomState();
  seedLobbyPlaylist();

  assert.equal(
    getRoomStateSnapshot().musicPlayback?.source,
    MUSIC_PLAYBACK_SOURCES.LOBBY
  );
});
