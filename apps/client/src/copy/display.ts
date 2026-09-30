import type { MinigameType } from "@wingnight/shared";
import type { Phase } from "@wingnight/shared";
import { formatClockSeconds, formatMinigameName, formatPhaseLabel } from "./formatters";

export const displayCopy = {
  roundFallbackLabel: "Phase details will appear on the next update.",
  waitingForStateLabel: "Waiting for room state...",
  waitingPhaseLabel: "Connecting",
  phaseLabel: (phase: Phase): string => formatPhaseLabel(phase),
  phaseContextTitle: (phaseLabel: string): string => `${phaseLabel} in progress`,
  sauceLabel: "Sauce",
  minigameLabel: "Mini-Game",
  minigameSectionTitle: "Mini-Game",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${formatMinigameName(minigame)} is up next.`,
  minigameWaitingForViewLabel:
    "Waiting for minigame display state from the server snapshot.",
  minigameRendererUnavailableLabel: (minigame: MinigameType): string =>
    `${formatMinigameName(minigame)} display surface is not available yet.`,
  eatingTimerLabel: "Round Timer",
  eatingTimerValue: formatClockSeconds,
  eatingActiveTeamLabel: "on the wings",
  eatingPhaseLabel: (sauce: string): string => `Eating · ${sauce}`,
  eatingPhaseFallbackLabel: "Eating",
  eatingTimesUpLabel: "Time's Up!",
  minigameTimerValue: formatClockSeconds,
  // The last ten seconds, as a room counts them: "9", never "00:09".
  minigameTimerUrgentValue: (remainingSeconds: number): string => String(remainingSeconds),
  minigameTimesUpLabel: "Time!",
  roundChipLabel: (round: number): string => `Round ${round}`,
  roundLabelSauceSummary: (label: string, sauce: string): string =>
    `${label} · ${sauce}`,
  standingsEmptyLabel: "No teams have joined yet.",
  standingLeaderLabel: "Leading",
  standingWinnerLabel: "Winner",
  standingTiedLabel: "Tied",
  standingRankOrdinalLabel: (rank: number): string => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  }
} as const;
