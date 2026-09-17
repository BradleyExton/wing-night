export const displayEmojiCharadesSurfaceCopy = {
  showTitle: "Emoji Charades",
  deckSelectionTitle: "Pick a deck",
  deckSelectionHint: "Pick on the tablet",
  deckSubjectCountLabel: (count: number): string =>
    `${count} subject${count === 1 ? "" : "s"}`,
  deckTooSmallLabel: "Too short for this round",
  clueingLabel: (teamName: string | null): string =>
    teamName === null ? "Clueing…" : `${teamName} is clueing…`,
  clueProgressLabel: (used: number, max: number): string => `${used} / ${max}`,
  revealCorrectLabel: "The answer was",
  revealSkippedLabel: "Skipped —",
  revealAwardLabel: "+1",
  turnCompleteTitle: "Turn complete",
  waitingLabel: "Waiting for the tablet…"
} as const;
