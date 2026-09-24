// The rail strip this surface used to draw is the shell's mini-rail now, so
// its title and its team chip went with it: `railTitle`, `teamPrefix` and the
// `noAssignedTeamLabel` that only `resolveActiveTeamName` ever reached for.
export const hostSongGuessSurfaceCopy = {
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Lounge covers of songs everyone knows. Play the clip, let the team shout it out, then rule on the title and the original artist — a point each.",
  waitingSongLabel:
    "No songs are loaded. Check minigames/song-guess.json and the audio folder.",
  songCounter: (songNumber: number, songsTotal: number): string =>
    `Song ${songNumber} of ${songsTotal}`,
  answerLabel: "Answer (host only)",
  artistPrefix: "by",
  playButtonLabel: "▶ Play clip",
  resumeButtonLabel: "▶ Resume",
  pauseButtonLabel: "⏸ Pause",
  replayButtonLabel: "↻ Replay",
  replayUsedLabel: "↻ Replay used",
  revealButtonLabel: "Reveal answer",
  nextSongButtonLabel: "Next song →",
  skipSongButtonLabel: "Skip song",
  doneLabel: "Set complete — advance the phase when the room is ready.",
  scoringTitle: "Score this song",
  // Both halves ruled: the TV has flipped to the card and the room is reading
  // it, so the pad's heading says so instead of asking for a score again.
  scoringOnDisplayTitle: "On the TV",
  titleRowLabel: "Title",
  artistRowLabel: "Artist",
  correctLabel: "✓",
  incorrectLabel: "✗",
  markAriaLabel: (field: string, isCorrect: boolean): string =>
    `Mark ${field} ${isCorrect ? "correct" : "incorrect"}`
} as const;
