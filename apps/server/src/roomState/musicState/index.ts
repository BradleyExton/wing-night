import {
  MUSIC_PLAYBACK_SOURCES,
  Phase,
  resolveAnthemIndexForRound,
  type MusicPlaybackSource,
  type RoomMusicPlaybackState,
  type RoomState
} from "@wingnight/shared";

// The display used to decide all of this from `phase` and `currentRound`. It
// now OBEYS it, so the decision moved here — the same move `setTimerForPhase`
// made, and for the same reason: a host control that mutates it needs
// something authoritative to mutate.

// Mirrors the display's own active-team resolution: a round-level team wins,
// and the turn-level team is the fallback.
const resolveActiveTeamAnthems = (state: RoomState): string[] => {
  const activeTeamId = state.activeRoundTeamId ?? state.activeTurnTeamId;

  if (activeTeamId === null) {
    return [];
  }

  return state.teams.find((team) => team.id === activeTeamId)?.anthems ?? [];
};

// The list a source's cursor indexes into. Always re-read from live state
// rather than cached on `musicPlayback`, so a content reload that shortens the
// playlist cannot strand the cursor past the end of it.
export const resolveMusicTrackList = (
  state: RoomState,
  source: MusicPlaybackSource
): string[] => {
  if (source === MUSIC_PLAYBACK_SOURCES.LOBBY) {
    return state.lobbyPlaylist;
  }

  return resolveActiveTeamAnthems(state);
};

const toMusicPlaybackState = (
  source: MusicPlaybackSource,
  tracks: string[],
  trackIndex: number,
  isPlaying: boolean
): RoomMusicPlaybackState | null => {
  const trackFileName = tracks[trackIndex];

  if (trackFileName === undefined) {
    return null;
  }

  return {
    source,
    trackFileName,
    trackIndex,
    trackCount: tracks.length,
    isPlaying
  };
};

// SETUP is the lobby playlist's; MINIGAME_INTRO is the anthem's. Everything
// else in the night is silent, which is the rule the two display-local cues
// already followed — the game's own moments (the round intro, the chime, a
// minigame that owns the speaker) are worse with a bed playing under them.
export const resolveMusicForPhase = (
  state: RoomState,
  nextPhase: Phase
): RoomMusicPlaybackState | null => {
  if (nextPhase === Phase.SETUP) {
    return toMusicPlaybackState(
      MUSIC_PLAYBACK_SOURCES.LOBBY,
      state.lobbyPlaylist,
      0,
      true
    );
  }

  if (nextPhase === Phase.MINIGAME_INTRO) {
    const anthems = resolveActiveTeamAnthems(state);

    return toMusicPlaybackState(
      MUSIC_PLAYBACK_SOURCES.ANTHEM,
      anthems,
      resolveAnthemIndexForRound(anthems.length, state.currentRound),
      true
    );
  }

  return null;
};

export const setMusicForPhase = (state: RoomState, nextPhase: Phase): void => {
  state.musicPlayback = resolveMusicForPhase(state, nextPhase);
};

// Re-seats the cursor on a given index of the CURRENT source, re-reading the
// track list so a stale `trackCount` never survives. Returns null when the
// index no longer exists, which stops playback rather than pointing the TV at
// a file that is not there.
export const resolveMusicAtIndex = (
  state: RoomState,
  current: RoomMusicPlaybackState,
  trackIndex: number,
  isPlaying: boolean
): RoomMusicPlaybackState | null => {
  return toMusicPlaybackState(
    current.source,
    resolveMusicTrackList(state, current.source),
    trackIndex,
    isPlaying
  );
};
