import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBrawlSurface } from "./DisplayBrawlSurface/index.js";
import { HostBrawlSurface } from "./HostBrawlSurface/index.js";

export const brawlRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBrawlSurface,
  DisplaySurface: DisplayBrawlSurface,
  // The TV is the speaker for the street's soundboard (spec §0.10), so the display offers its
  // tap-to-unlock overlay even for a team with no anthem to play.
  requiresDisplayAudio: true
};
