import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySpotterSurface } from "./DisplaySpotterSurface/index.js";
import { HostSpotterSurface } from "./HostSpotterSurface/index.js";

export const spotterRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSpotterSurface,
  DisplaySurface: DisplaySpotterSurface
};
