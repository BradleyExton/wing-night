import type { MinigameType } from "@wingnight/shared";

import { DisplayGeoSurface } from "../geo/DisplayGeoSurface";
import { HostGeoSurface } from "../geo/HostGeoSurface";
import { DisplayTriviaSurface } from "../trivia/DisplayTriviaSurface";
import { HostTriviaSurface } from "../trivia/HostTriviaSurface";
import type { MinigameRendererBundle } from "../types";

const minigameRendererByType: Record<MinigameType, MinigameRendererBundle | null> =
  {
    TRIVIA: {
      HostSurface: HostTriviaSurface,
      DisplaySurface: DisplayTriviaSurface
    },
    GEO: {
      HostSurface: HostGeoSurface,
      DisplaySurface: DisplayGeoSurface
    },
    DRAWING: null
  };

export const resolveMinigameRendererBundle = (
  minigameType: MinigameType
): MinigameRendererBundle | null => {
  return minigameRendererByType[minigameType];
};
