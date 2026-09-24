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
  // Server clock at the mark that completed the ruling on the current song,
  // `null` until both halves are in. It opens the TV's reveal window and is
  // reset with the song, so the next song's answer starts held again.
  revealedAtMs: number | null;
};

export const DEFAULT_SONG_GUESS_SONGS_PER_TURN = 4;

// One point for the title, one for the original artist.
export const SONG_GUESS_POINTS_PER_MARK = 1;

// How long the TV holds the reveal card once the host moves on — the same
// window DRAWING's `PROMPT_REVEAL_MS` gives its plaque. It is a display-side
// render window timed from arrival, never a server timer: the host's next tap
// is never blocked by it.
export const SONG_GUESS_REVEAL_MS = 2000;

export const EMPTY_SONG_GUESS_TEAM_SCORE: SongGuessTeamScore = {
  title: null,
  artist: null
};
