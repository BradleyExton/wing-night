import {
  MUSIC_PLAYBACK_SOURCES,
  Phase,
  resolveAnthemIndexForRound,
  resolveEatingTrackIndexForTurn,
  type MusicPlaybackSource,
  type RoomMusicPlaybackState,
  type RoomState,
  type Team
} from "@wingnight/shared";

// The display used to decide all of this from `phase` and `currentRound`. It
// now OBEYS it, so the decision moved here — the same move `setTimerForPhase`
// made, and for the same reason: a host control that mutates it needs
// something authoritative to mutate.

// Mirrors the display's own active-team resolution: a round-level team wins,
// and the turn-level team is the fallback.
const resolveActiveTeamId = (state: RoomState): string | null => {
  return state.activeRoundTeamId ?? state.activeTurnTeamId;
};

const resolveTeamAnthems = (state: RoomState, teamId: string | null): string[] => {
  if (teamId === null) {
    return [];
  }

  return state.teams.find((team) => team.id === teamId)?.anthems ?? [];
};

// Pure: the one team strictly ahead on total score, or nobody. A tie at the
// top crowns no one — the standings footer follows the same rule — so a tied
// results screen plays no anthem rather than the alphabetically-first team's.
export const resolveStrictLeaderTeamId = (
  teams: readonly Pick<Team, "id" | "totalScore">[]
): string | null => {
  let leader: Pick<Team, "id" | "totalScore"> | null = null;
  let isTied = false;

  for (const team of teams) {
    if (leader === null || team.totalScore > leader.totalScore) {
      leader = team;
      isTied = false;
    } else if (team.totalScore === leader.totalScore) {
      isTied = true;
    }
  }

  return leader === null || isTied ? null : leader.id;
};

// The list a source's cursor indexes into. Always re-read from live state
// rather than cached on `musicPlayback`, so a content reload that shortens the
// playlist cannot strand the cursor past the end of it. An anthem names its
// team; one cued before `anthemTeamId` existed is the active team's.
export const resolveMusicTrackList = (
  state: RoomState,
  music: Pick<RoomMusicPlaybackState, "source" | "anthemTeamId">
): string[] => {
  if (music.source === MUSIC_PLAYBACK_SOURCES.LOBBY) {
    return state.lobbyPlaylist;
  }

  if (music.source === MUSIC_PLAYBACK_SOURCES.EATING) {
    return state.eatingPlaylist;
  }

  return resolveTeamAnthems(state, music.anthemTeamId ?? resolveActiveTeamId(state));
};

const toMusicPlaybackState = (
  source: MusicPlaybackSource,
  tracks: string[],
  trackIndex: number,
  isPlaying: boolean,
  anthemTeamId?: string
): RoomMusicPlaybackState | null => {
  const trackFileName = tracks[trackIndex];

  if (trackFileName === undefined) {
    return null;
  }

  return {
    source,
    ...(anthemTeamId === undefined ? {} : { anthemTeamId }),
    trackFileName,
    trackIndex,
    trackCount: tracks.length,
    isPlaying
  };
};

const toAnthemPlaybackState = (
  state: RoomState,
  teamId: string | null
): RoomMusicPlaybackState | null => {
  if (teamId === null) {
    return null;
  }

  const anthems = resolveTeamAnthems(state, teamId);

  return toMusicPlaybackState(
    MUSIC_PLAYBACK_SOURCES.ANTHEM,
    anthems,
    resolveAnthemIndexForRound(anthems.length, state.currentRound),
    true,
    teamId
  );
};

// SETUP is the lobby playlist's; EATING is the eating playlist's;
// MINIGAME_INTRO is the active team's anthem; ROUND_RESULTS and
// FINAL_RESULTS are the leader's anthem — the team strictly ahead once the
// round's scores are in, and nobody's on a tie. Everything else in the night
// is silent: a game's own moments (its cues, its clock, a minigame that owns
// the speaker) are worse with a bed playing under them, which is why
// MINIGAME_PLAY and TURN_RESULTS get nothing.
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

  if (nextPhase === Phase.EATING) {
    return toMusicPlaybackState(
      MUSIC_PLAYBACK_SOURCES.EATING,
      state.eatingPlaylist,
      resolveEatingTrackIndexForTurn(
        state.eatingPlaylist.length,
        state.currentRound,
        state.roundTurnCursor,
        state.turnOrderTeamIds.length
      ),
      true
    );
  }

  if (nextPhase === Phase.MINIGAME_INTRO) {
    return toAnthemPlaybackState(state, resolveActiveTeamId(state));
  }

  if (nextPhase === Phase.ROUND_RESULTS || nextPhase === Phase.FINAL_RESULTS) {
    return toAnthemPlaybackState(state, resolveStrictLeaderTeamId(state.teams));
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
    resolveMusicTrackList(state, current),
    trackIndex,
    isPlaying,
    current.anthemTeamId
  );
};
