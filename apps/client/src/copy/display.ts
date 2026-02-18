import type { MinigameType } from "@wingnight/shared";
import type { Phase } from "@wingnight/shared";

export const displayCopy = {
  placeholderTitle: "Wing Night",
  placeholderDescription: "The broadcast board follows the server snapshot.",
  roundFallbackLabel: "Round context will appear on the next phase update.",
  waitingForStateLabel: "Waiting for room state...",
  waitingPhaseLabel: "Connecting",
  currentRoundLabel: (currentRound: number, totalRounds: number): string =>
    `Round ${currentRound} of ${totalRounds}`,
  phaseLabel: (phase: Phase): string =>
    phase
      .toLowerCase()
      .split("_")
      .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
      .join(" "),
  roundIntroTitle: (roundNumber: number, label: string): string =>
    `Round ${roundNumber}: ${label}`,
  phaseContextTitle: (phaseLabel: string): string => `${phaseLabel} in progress`,
  sauceLabel: "Sauce",
  minigameLabel: "Mini-Game",
  roundSauceSummary: (sauce: string): string => `Sauce: ${sauce}`,
  roundMinigameSummary: (minigame: MinigameType): string =>
    `Mini-Game: ${minigame}`,
  minigameSectionTitle: "Mini-Game",
  minigameIntroDescription: (minigame: MinigameType): string =>
    `${minigame} is up next.`,
  triviaTurnTitle: "Trivia Turn",
  triviaQuestionLabel: "Question",
  activeTeamLabel: "Active Team",
  activeTeamValue: (teamName: string): string => teamName,
  turnProgressTitle: "Turn Progress",
  turnProgressLabel: (turnNumber: number, totalTurns: number): string =>
    `Team ${turnNumber} of ${totalTurns}`,
  eatingTimerLabel: "Round Timer",
  eatingTimerValue: (eatingSeconds: number): string => {
    const minutes = Math.floor(eatingSeconds / 60);
    const seconds = eatingSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  },
  standingsTitle: "Standings",
  standingsEmptyLabel: "No teams have joined yet.",
  standingScoreLabel: (score: number): string => `${score} pts`
} as const;
