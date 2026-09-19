import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySongGuessSurface } from "./DisplaySongGuessSurface/index.js";
import { HostSongGuessSurface } from "./HostSongGuessSurface/index.js";

// The TV is the speaker for this round; the display shell learns that from
// `requiresDisplayAudio` in the app's minigame registry, which can say so
// without downloading these surfaces.
export const songGuessRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSongGuessSurface,
  DisplaySurface: DisplaySongGuessSurface
};
