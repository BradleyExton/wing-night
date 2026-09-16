import type {
  SongGuessContentFile,
  SongGuessPhase,
  SongGuessTeamScore
} from "@wingnight/shared";

export type SongGuessRuntimeContent = SongGuessContentFile;

export type SongGuessRuntimeRules = {
  songsPerTurn: number;
};

export type SongGuessRuntimeState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  phase: SongGuessPhase;
  // Index into `selectedSongIds`, not into the content pack.
  songCursor: number;
  // Locked at initialize so a mid-turn reconnect rehydrates the same setlist.
  selectedSongIds: string[];
  // Resets per song; the one-replay rule is enforced in the reducer.
  replayUsed: boolean;
  scoresBySongId: Record<string, SongGuessTeamScore>;
  pendingPointsByTeamId: Record<string, number>;
};

export const DEFAULT_SONG_GUESS_SONGS_PER_TURN = 4;

// One point for the title, one for the original artist.
export const SONG_GUESS_POINTS_PER_MARK = 1;

export const EMPTY_SONG_GUESS_TEAM_SCORE: SongGuessTeamScore = {
  title: null,
  artist: null
};
