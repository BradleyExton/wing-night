import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBrawlSurface } from "./DisplayBrawlSurface/index.js";
import { HostBrawlSurface } from "./HostBrawlSurface/index.js";

export const brawlRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBrawlSurface,
  DisplaySurface: DisplayBrawlSurface
};
