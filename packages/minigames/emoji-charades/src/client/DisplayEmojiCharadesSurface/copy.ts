import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const displayEmojiCharadesSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.EMOJI_CHARADES.displayName,
  pendingPointsLabel: (points: number): string =>
    `+${points} pending`,
  clueingLabel: (teamName: string | null): string =>
    teamName === null ? "Clueing…" : `${teamName} is clueing…`,
  clueProgressLabel: (used: number, max: number): string => `${used} / ${max}`,
  revealCorrectLabel: "The answer was",
  revealSkippedLabel: "Skipped — the answer was",
  revealAwardLabel: (points: number): string => `+${points}`,
  turnCompleteTitle: "Turn complete",
  turnCompleteHint: (points: number): string =>
    `${points} point${points === 1 ? "" : "s"} this turn`,
  waitingLabel: "Waiting for the tablet…"
} as const;
