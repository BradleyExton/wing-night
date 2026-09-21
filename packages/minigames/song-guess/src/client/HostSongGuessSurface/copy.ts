export const hostSongGuessSurfaceCopy = {
  railTitle: "Lounge Set",
  teamPrefix: "On the mic:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Lounge covers of songs everyone knows. Play the clip, let the team shout it out, then rule on the title and the original artist — a point each.",
  waitingSongLabel:
    "No songs are loaded. Check minigames/song-guess.json and the audio folder.",
  songCounter: (songNumber: number, songsTotal: number): string =>
    `Song ${songNumber} of ${songsTotal}`,
  answerLabel: "Answer (host only)",
  artistPrefix: "by",
  hintLabel: "Hint",
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
  titleRowLabel: "Title",
  artistRowLabel: "Artist",
  correctLabel: "✓",
  incorrectLabel: "✗",
  markAriaLabel: (field: string, isCorrect: boolean): string =>
    `Mark ${field} ${isCorrect ? "correct" : "incorrect"}`
} as const;
