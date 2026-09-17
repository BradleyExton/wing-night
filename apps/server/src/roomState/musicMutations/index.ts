import {
  MUSIC_PLAYBACK_SOURCES,
  resolveNextTrackIndex,
  type MusicPlaybackSource
} from "@wingnight/shared";

import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { resolveMusicAtIndex, resolveMusicTrackList } from "../musicState/index.js";

// No `requiredPhase`: the music is whatever `resolveMusicForPhase` last put
// there, and gating these on a phase would duplicate that decision in a second
// place. A phase with no music has `musicPlayback === null`, which every
// mutation here rejects on its own.

export const pauseRoomMusic = defineRoomMutation({
  run: (roomState): boolean => {
    const music = roomState.musicPlayback;

    if (music === null || !music.isPlaying) {
      return false;
    }

    roomState.musicPlayback = { ...music, isPlaying: false };

    return true;
  }
});

export const resumeRoomMusic = defineRoomMutation({
  run: (roomState): boolean => {
    const music = roomState.musicPlayback;

    if (music === null || music.isPlaying) {
      return false;
    }

    roomState.musicPlayback = { ...music, isPlaying: true };

    return true;
  }
});

// Skip implies play: a host tapping Next on paused music wants the next track
// playing, not the next track sitting paused.
export const skipRoomMusicTrack = defineRoomMutation({
  run: (roomState): boolean => {
    const music = roomState.musicPlayback;

    if (music === null) {
      return false;
    }

    const tracks = resolveMusicTrackList(roomState, music.source);
    const nextIndex = resolveNextTrackIndex(music.trackIndex, tracks.length);
    const nextMusic = resolveMusicAtIndex(roomState, music, nextIndex, true);

    // A one-track source wraps to itself, so nothing changed and there is no
    // broadcast to make. Restarting the only track is what Pause/Resume is for.
    if (nextMusic === null || (nextIndex === music.trackIndex && music.isPlaying)) {
      return false;
    }

    roomState.musicPlayback = nextMusic;

    return true;
  }
});

// Reported by the DISPLAY, which owns the `<audio>` element and is therefore
// the only client that can know a track finished. See `MusicTrackEndedPayload`:
// it is a report about a specific track, and everything below is the guard that
// keeps it one. A stale report (a display that reconnected mid-track), a replay
// and a second display reporting the same track are all no-ops.
export const reportRoomMusicTrackEnded = defineRoomMutation({
  run: (
    roomState,
    source: MusicPlaybackSource,
    trackIndex: number
  ): boolean => {
    const music = roomState.musicPlayback;

    if (
      music === null ||
      !music.isPlaying ||
      music.source !== source ||
      music.trackIndex !== trackIndex
    ) {
      return false;
    }

    // An anthem is a one-shot cue, not a playlist: it ends and the room goes
    // quiet until the next phase. Rotation across a team's anthems is keyed to
    // the ROUND, so playing the next one here would break that determinism —
    // a display refresh would come back on a different anthem.
    if (music.source === MUSIC_PLAYBACK_SOURCES.ANTHEM) {
      roomState.musicPlayback = { ...music, isPlaying: false };

      return true;
    }

    const tracks = resolveMusicTrackList(roomState, music.source);
    const nextMusic = resolveMusicAtIndex(
      roomState,
      music,
      resolveNextTrackIndex(music.trackIndex, tracks.length),
      true
    );

    // The playlist emptied under us (a content reload mid-party). Silence beats
    // pointing the TV at a file that is no longer there.
    roomState.musicPlayback = nextMusic;

    return true;
  }
});
