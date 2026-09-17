export const hostEmojiCharadesSurfaceCopy = {
  introDescription:
    "One picker per team. Pick a deck, then clue the subject in emoji only.",
  playDescription: "Tap emoji to build the clue. Your team shouts the guesses.",
  noAssignedTeamLabel: "No team assigned",
  activeTeamMetaLabel: "Clueing",
  deckSelectionTitle: "Pick a deck",
  deckSelectionHint: "Your team picks, then the clock starts.",
  deckSubjectCountLabel: (count: number): string =>
    `${count} subject${count === 1 ? "" : "s"}`,
  deckTooSmallLabel: "Needs more subjects",
  subjectLabel: "Your subject",
  subjectsRemainingLabel: (count: number): string =>
    `${count} subject${count === 1 ? "" : "s"} left`,
  waitingSubjectLabel: "Waiting for the next subject…",
  emptySequenceLabel: "Tap emoji to start the clue",
  searchPlaceholderLabel: "Search all emoji…",
  searchClearLabel: "Clear search",
  noSearchResultsLabel: "No emoji match that search",
  backButtonLabel: "⌫ Back",
  clearButtonLabel: "✕ Clear",
  gotItButtonLabel: "Got it",
  gotItButtonHint: "+1 point",
  skipButtonLabel: "Skip",
  skipButtonHint: "no points",
  turnCompleteTitle: "Turn complete",
  turnCompleteHint: "Hand the tablet back to the host."
} as const;
