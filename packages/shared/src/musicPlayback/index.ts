// The room's music, as server-authoritative state.
//
// Playback used to be entirely display-local: the TV derived what to play from
// `phase` and `currentRound` and the server never knew a track existed. Host
// control inverts that — "pause" and "skip" are mutations, so what is playing
// and whether it is playing become room state, exactly like `timer`. The cues
// on the display are now PROJECTIONS of this state rather than owners of it.

export const MUSIC_PLAYBACK_SOURCES = {
  // The SETUP lobby playlist: `content/local/audio/lobby/`, filename-ordered.
  LOBBY: "LOBBY",
  // The active team's anthem for the round: `Team.anthems`, round-rotated.
  ANTHEM: "ANTHEM"
} as const;

export type MusicPlaybackSource =
  (typeof MUSIC_PLAYBACK_SOURCES)[keyof typeof MUSIC_PLAYBACK_SOURCES];

export type RoomMusicPlaybackState = {
  source: MusicPlaybackSource;
  // The filename inside that source's directory. The display turns it into a
  // URL, because only the display knows the server origin.
  trackFileName: string;
  // Cursor within the source's own list, and the list's length. `trackCount`
  // is carried rather than re-derived because the display cannot see a team's
  // anthem list for a team that is not the active one.
  trackIndex: number;
  trackCount: number;
  isPlaying: boolean;
};

// POSITION IS DELIBERATELY ABSENT. A display refresh mid-track restarts the
// current track rather than resuming it: tracking elapsed position would mean
// `RoomTimerState`-shaped machinery (startedAt/endsAt/pausedAt, all of it
// re-derived on every pause) for a case that happens when someone bumps the
// HDMI cable. The track is right, the round is right, and the song starts over.

// Which of a team's anthems plays this round.
//
// Deterministic by round number, never random, and that is the whole contract:
// the display can refresh mid-MINIGAME_INTRO — a TV that lost the socket, a
// browser reloaded because someone bumped the HDMI — and it must come back on
// the SAME track rather than restarting the night's playlist somewhere else.
//
// Rounds are 1-based (0 means pre-round), hence `currentRound - 1`. A team with
// more rounds than anthems wraps around to the top of its own list.
export const resolveAnthemIndexForRound = (
  anthemCount: number,
  currentRound: number | null
): number => {
  if (anthemCount <= 0) {
    return 0;
  }

  if (currentRound === null || currentRound < 1) {
    return 0;
  }

  return (currentRound - 1) % anthemCount;
};

export const resolveAnthemForRound = (
  anthems: string[] | null,
  currentRound: number | null
): string | null => {
  if (anthems === null || anthems.length === 0) {
    return null;
  }

  return anthems[resolveAnthemIndexForRound(anthems.length, currentRound)] ?? null;
};

// Sequential and wrapping, never shuffled: two displays (or one display and a
// refresh) landing on the same track is the same determinism rule the anthem
// rotation follows.
export const resolveNextTrackIndex = (
  currentIndex: number,
  trackCount: number
): number => {
  if (trackCount <= 0) {
    return 0;
  }

  return (currentIndex + 1) % trackCount;
};

// `01-hot-in-herre.mp3` is a filename, not display copy. Deriving the title
// keeps the lobby directory's convention-over-configuration promise — a host
// drops MP3s in an hour before guests arrive and the TV names them — where a
// sidecar metadata file would have made the directory an authoring chore for
// the sake of an em dash and an artist name.
//
// Leading `NN-`, `NN_` and `NN ` prefixes are the ordering mechanism
// `loadLobbyPlaylist` sorts on, so they are stripped: they are plumbing the
// room should never read off the TV.
const TRACK_NUMBER_PREFIX_PATTERN = /^\d+\s*[-_. ]\s*/;
const TRACK_EXTENSION_PATTERN = /\.[^.]+$/;
const WORD_SEPARATOR_PATTERN = /[-_\s]+/;

// Only the FIRST letter is touched. Lowercasing the remainder would turn
// `TNT.mp3` into `Tnt` and `DJ-Khaled` into `Dj Khaled`, so whatever casing the
// host typed in the rest of the word is what the TV shows.
const capitalizeWord = (word: string): string => {
  if (word.length === 0) {
    return word;
  }

  return `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`;
};

const toTitleWords = (value: string): string[] => {
  return value
    .split(WORD_SEPARATOR_PATTERN)
    .filter((word) => word.length > 0)
    .map(capitalizeWord);
};

export const resolveTrackTitle = (trackFileName: string): string => {
  const withoutExtension = trackFileName.replace(TRACK_EXTENSION_PATTERN, "");
  const words = toTitleWords(
    withoutExtension.replace(TRACK_NUMBER_PREFIX_PATTERN, "")
  );

  if (words.length > 0) {
    return words.join(" ");
  }

  // `01-.mp3` strips down to nothing. `loadLobbyPlaylist` takes whatever MP3s
  // sit in the directory, so this is reachable, and an empty strip on the TV is
  // worse than the ordering prefix the strip was trying to hide. Fall back to
  // the name with its prefix intact, and to the raw filename after that.
  const unstrippedWords = toTitleWords(withoutExtension);

  return unstrippedWords.length > 0 ? unstrippedWords.join(" ") : trackFileName;
};
