import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayMountSurface } from "./DisplayMountSurface/index.js";
import { HostMountSurface } from "./HostMountSurface/index.js";

// PLACEHOLDER surfaces until the surfaces step (spec §0.2 step 6) lands the real ones.
export const mountRendererBundle: MinigameRendererBundle = {
  HostSurface: HostMountSurface,
  DisplaySurface: DisplayMountSurface,
  // The TV is the speaker for the climb's soundboard (spec §0.7), so the display offers its
  // tap-to-unlock overlay even for a team with no anthem to play.
  requiresDisplayAudio: true
};
