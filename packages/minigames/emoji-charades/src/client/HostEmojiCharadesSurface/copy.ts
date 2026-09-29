export const hostEmojiCharadesSurfaceCopy = {
  introDescription:
    "One picker per team. The deck is dealt — clue each subject in emoji only.",
  subjectLabel: "Your subject",
  subjectsRemainingLabel: (count: number): string =>
    `${count} subject${count === 1 ? "" : "s"} left`,
  pendingChip: (points: number): string => `+${points} pending`,
  waitingSubjectLabel: "Waiting for the next subject…",
  clueLabel: "Your clue",
  clueCountLabel: (used: number, max: number): string => `${used} / ${max}`,
  emptySequenceLabel: "Tap emoji to start the clue",
  searchPlaceholderLabel: "Search every emoji — dog, pizza, money…",
  searchIconGlyph: "\u{1F50D}",
  searchClearLabel: "Clear",
  searchResultsLabel: (query: string): string => `Results for “${query.trim()}”`,
  searchLoadingLabel: "Loading emoji names…",
  noSearchResultsLabel: (query: string): string =>
    `Nothing called “${query.trim()}” — try a simpler word`,
  usedThisTurnLabel: "Used this turn",
  lockedPickerLabel: (subjectText: string): string =>
    `${subjectText} only ever picks these`,
  backButtonLabel: "⌫ Back",
  clearButtonLabel: "✕ Clear",
  gotItButtonLabel: "Got it",
  gotItButtonHint: "+1 point",
  gotItIconGlyph: "✓",
  skipButtonLabel: "Skip",
  skipButtonHint: "no points",
  skipIconGlyph: "↷",
  turnCompleteTitle: "Turn complete",
  turnCompleteHint: "Hand the tablet back to the host."
} as const;
