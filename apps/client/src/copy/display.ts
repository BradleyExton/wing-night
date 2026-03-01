import type { MinigameType } from "@wingnight/shared";
import type { Phase } from "@wingnight/shared";
import { formatClockSeconds, formatPhaseLabel } from "./formatters";

export const displayCopy = {
  roundFallbackLabel: "Round context will appear on the next phase update.",
  waitingForStateLabel: "Waiting for room state...",
  waitingPhaseLabel: "Connecting",
  currentRoundLabel: (currentRound: number, totalRounds: number): string =>
    `Round ${currentRound} of ${totalRounds}`,
  phaseLabel: (phase: Phase): string => formatPhaseLabel(phase),
  roundIntroTitle: (roundNumber: number, label: string): string =>
    `Round ${roundNumber}: ${label}`,
  phaseContextTitle: (phaseLabel: string): string => `${phaseLabel} in progress`,
  setupIdleTitle: "Waiting for host to start",
  sauceLabel: "Sauce",
  minigameLabel: "Mini-Game",
  roundSauceSummary: (sauce: string): string => `Sauce: ${sauce}`,
  roundMinigameSummary: (minigame: MinigameType): string =>
    `Mini-Game: ${minigame}`,
  minigameSectionTitle: "Mini-Game",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${minigame} is up next.`,
  minigameWaitingForViewLabel:
    "Waiting for minigame display state from the server snapshot.",
  minigameRendererUnavailableLabel: (minigame: MinigameType): string =>
    `${minigame} display surface is not available yet.`,
  triviaTurnTitle: "Trivia Turn",
  triviaQuestionLabel: "Question",
  activeTeamLabel: "Active Team",
  activeTeamValue: (teamName: string): string => teamName,
  eatingTimerLabel: "Round Timer",
  eatingTimerValue: formatClockSeconds,
  standingsTitle: "Standings",
  standingsEmptyLabel: "No teams have joined yet.",
  standingScoreLabel: (score: number): string => `${score} pts`
} as const;
