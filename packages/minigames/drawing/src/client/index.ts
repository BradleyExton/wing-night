import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayDrawingSurface } from "./DisplayDrawingSurface/index.js";
import { HostDrawingSurface } from "./HostDrawingSurface/index.js";

export const drawingRendererBundle: MinigameRendererBundle = {
  HostSurface: HostDrawingSurface,
  DisplaySurface: DisplayDrawingSurface
};
