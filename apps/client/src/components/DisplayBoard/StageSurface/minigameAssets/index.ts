import type { MinigameType } from "@wingnight/shared";

const DISPLAY_ASSET_ROOT = "/display/minigames";

const minigameIconPathByType: Record<MinigameType, string> = {
  TRIVIA: `${DISPLAY_ASSET_ROOT}/trivia-icon.svg`,
  GEO: `${DISPLAY_ASSET_ROOT}/geo-icon.svg`,
  DRAWING: `${DISPLAY_ASSET_ROOT}/drawing-icon.svg`
};

const minigameTypeByIconKey: Record<string, MinigameType> = {
  trivia: "TRIVIA",
  geo: "GEO",
  drawing: "DRAWING"
};

export const resolveMinigameIconPath = (minigameType: MinigameType): string => {
  return minigameIconPathByType[minigameType];
};

export const resolveMinigameIconPathFromKey = (
  iconKey: string,
  fallbackMinigameType: MinigameType
): string => {
  const normalizedIconKey = iconKey.trim().toLowerCase();
  const minigameType = minigameTypeByIconKey[normalizedIconKey] ?? fallbackMinigameType;

  return resolveMinigameIconPath(minigameType);
};
