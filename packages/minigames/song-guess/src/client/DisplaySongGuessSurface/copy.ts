export const displaySongGuessSurfaceCopy = {
  // The show's name. It is the marquee title on the TV and the heading on the
  // intro screen — one string, because it is one name.
  showTitle: "Who's That Song",
  introDescription:
    "Lounge covers of songs you already know. Name the song, then name who did it first.",
  songCounter: (songNumber: number, songsTotal: number): string =>
    `Song ${songNumber} of ${songsTotal}`,
  listenPrompt: "🎵 Listen closely…",
  lockInPrompt: "Lock in your answers",
  lockInHint: "Title and original artist — one point each.",
  // The host has opened the ruling and is still tapping; the answer stays
  // off the wall until both halves are in.
  rulingPrompt: "And the ruling is…",
  rulingHint: "Title and original artist — one point each.",
  revealLabel: "The answer",
  revealArtistPrefix: "by",
  verdictTitleField: "Title",
  verdictArtistField: "Artist",
  verdictHit: "Hit",
  verdictMiss: "Miss",
  verdictHitGlyph: "✓",
  verdictMissGlyph: "✗",
  // This song's points, never the running total (DESIGN.md §2.13).
  pointsEarned: (points: number): string => {
    if (points === 0) {
      return "No points this song";
    }

    return `+${points} ${points === 1 ? "point" : "points"} this song`;
  },
  donePrompt: "That's the set",
  doneHint: "Scores go up at the end of the round.",
  waitingLabel: "Waiting for the host…",
  nowPlayingLabel: "Now playing"
} as const;
