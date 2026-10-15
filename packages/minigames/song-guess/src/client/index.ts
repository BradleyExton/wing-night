import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySongGuessSurface } from "./DisplaySongGuessSurface/index.js";
import { HostSongGuessSurface } from "./HostSongGuessSurface/index.js";

export const songGuessRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSongGuessSurface,
  DisplaySurface: DisplaySongGuessSurface
};
