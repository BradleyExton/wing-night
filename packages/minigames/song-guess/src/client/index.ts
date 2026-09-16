import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySongGuessSurface } from "./DisplaySongGuessSurface/index.js";
import { HostSongGuessSurface } from "./HostSongGuessSurface/index.js";

export const songGuessRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSongGuessSurface,
  DisplaySurface: DisplaySongGuessSurface,
  // The TV is the speaker for this round, so the display shell must offer its
  // tap-to-enable-audio overlay even when the active team has no anthem.
  requiresDisplayAudio: true
};
