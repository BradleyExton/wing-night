import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySchlonicSurface } from "./DisplaySchlonicSurface/index.js";
import { HostSchlonicSurface } from "./HostSchlonicSurface/index.js";

export const schlonicRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSchlonicSurface,
  DisplaySurface: DisplaySchlonicSurface,
  // The TV has a soundboard (`audio/`), so the display offers its tap-to-unlock overlay even
  // for a team with no anthem to play.
  requiresDisplayAudio: true
};
