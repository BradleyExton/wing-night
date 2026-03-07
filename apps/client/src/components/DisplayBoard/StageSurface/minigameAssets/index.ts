import type { MinigameType } from "@wingnight/shared";

const DISPLAY_ASSET_ROOT = "/display/minigames";

const minigameIconPathByType: Record<MinigameType, string> = {
  TRIVIA: `${DISPLAY_ASSET_ROOT}/trivia-icon.svg`,
  GEO: `${DISPLAY_ASSET_ROOT}/geo-icon.svg`,
  DRAWING: `${DISPLAY_ASSET_ROOT}/drawing-icon.svg`
};

const minigameCardAssetPathByType: Partial<Record<MinigameType, string>> = {
  TRIVIA: `${DISPLAY_ASSET_ROOT}/trivia-illustration.png`,
  GEO: `${DISPLAY_ASSET_ROOT}/geo-illustration.png`
};

export const resolveMinigameIconPath = (minigameType: MinigameType): string => {
  return minigameIconPathByType[minigameType];
};

export const resolveMinigameCardAssetPath = (minigameType: MinigameType): string => {
  return minigameCardAssetPathByType[minigameType] ?? minigameIconPathByType[minigameType];
};
