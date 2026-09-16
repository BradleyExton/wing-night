export const displaySongGuessSurfaceCopy = {
  introTitle: "Who's That Song",
  introDescription:
    "Lounge covers of songs you already know. Name the song, then name who did it first.",
  songCounter: (songNumber: number, songsTotal: number): string =>
    `Song ${songNumber} of ${songsTotal}`,
  listenPrompt: "🎵 Listen closely…",
  lockInPrompt: "Lock in your answers",
  lockInHint: "Title and original artist — one point each.",
  revealLabel: "The answer",
  revealArtistPrefix: "by",
  donePrompt: "That's the set",
  doneHint: "Scores go up at the end of the round.",
  waitingLabel: "Waiting for the host…",
  nowPlayingLabel: "Now playing"
} as const;
