import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayContraptionSurface } from "./DisplayContraptionSurface/index.js";
import { HostContraptionSurface } from "./HostContraptionSurface/index.js";

export const contraptionRendererBundle: MinigameRendererBundle = {
  HostSurface: HostContraptionSurface,
  DisplaySurface: DisplayContraptionSurface
};
