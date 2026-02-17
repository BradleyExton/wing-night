import { triviaMinigameModule } from "@wingnight/minigames-trivia";
import type { MinigameType } from "@wingnight/shared";

export type ResolvedMinigameModule = typeof triviaMinigameModule;

export const resolveMinigameModule = (
  minigameType: MinigameType
): ResolvedMinigameModule | null => {
  if (minigameType === "TRIVIA") {
    return triviaMinigameModule;
  }

  return null;
};
