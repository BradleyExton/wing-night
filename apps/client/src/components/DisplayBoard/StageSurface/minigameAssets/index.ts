import type { MinigameType } from "@wingnight/shared";

import { resolveMinigameTypeFromSlug } from "../../../../minigames/registry";

const DISPLAY_ASSET_ROOT = "/display/minigames";

const minigameIconPathByType: Record<MinigameType, string> = {
  TRIVIA: `${DISPLAY_ASSET_ROOT}/trivia-icon.svg`,
  GEO: `${DISPLAY_ASSET_ROOT}/geo-icon.svg`,
  DRAWING: `${DISPLAY_ASSET_ROOT}/drawing-icon.svg`
};

export const resolveMinigameIconPath = (minigameType: MinigameType): string => {
  return minigameIconPathByType[minigameType];
};

export const resolveMinigameIconPathFromKey = (
  iconKey: string,
  fallbackMinigameType: MinigameType
): string => {
  const minigameType = resolveMinigameTypeFromSlug(iconKey) ?? fallbackMinigameType;

  return resolveMinigameIconPath(minigameType);
};
