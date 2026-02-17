import type { MinigameType } from "@wingnight/shared";

export const displayCopy = {
  placeholderTitle: "Display Route Placeholder",
  placeholderDescription: "Display view will render here.",
  roundFallbackLabel: "Round details will appear when the host advances.",
  waitingForStateLabel: "Waiting for room state...",
  roundIntroTitle: (roundNumber: number, label: string): string =>
    `Round ${roundNumber}: ${label}`,
  roundSauceSummary: (sauce: string): string => `Sauce: ${sauce}`,
  roundMinigameSummary: (minigame: MinigameType): string =>
    `Mini-Game: ${minigame}`
} as const;
