import type { MinigameType } from "@wingnight/shared";

export const minigameIntroStageCopy = {
  title: (displayName: string): string => `Up Next: ${displayName}`,
  objectiveLabel: "Objective",
  howToPlayLabel: "How to Play",
  winConditionLabel: "Win Condition",
  quickTipLabel: "Quick Tip",
  sauceChip: (sauce: string): string => `Sauce: ${sauce}`,
  minigameChip: (minigame: MinigameType): string => `Mini-Game: ${minigame}`,
  fallbackDescription: (minigame: MinigameType): string =>
    `${minigame} details are loading from the game module.`,
  iconAlt: (displayName: string): string => `${displayName} icon`
} as const;
