import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayTriviaSurface } from "./DisplayTriviaSurface/index.js";
import { HostTriviaSurface } from "./HostTriviaSurface/index.js";
import { PlayerTriviaSurface } from "./PlayerTriviaSurface/index.js";

export const triviaRendererBundle: MinigameRendererBundle = {
  HostSurface: HostTriviaSurface,
  DisplaySurface: DisplayTriviaSurface,
  PlayerSurface: PlayerTriviaSurface
};
