import type { MinigameType } from "@wingnight/shared";

import { DisplayTriviaSurface } from "../trivia/DisplayTriviaSurface";
import { HostTriviaSurface } from "../trivia/HostTriviaSurface";
import type { MinigameRendererBundle } from "../types";

const minigameRendererByType: Record<MinigameType, MinigameRendererBundle | null> =
  {
    TRIVIA: {
      HostSurface: HostTriviaSurface,
      DisplaySurface: DisplayTriviaSurface
    },
    GEO: null,
    DRAWING: null
  };

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return minigameRendererByType[minigameType];
};
