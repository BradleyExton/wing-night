import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayGeoSurface } from "./DisplayGeoSurface/index.js";
import { HostGeoSurface } from "./HostGeoSurface/index.js";
import { PlayerGeoSurface } from "./PlayerGeoSurface/index.js";

export const geoRendererBundle: MinigameRendererBundle = {
  HostSurface: HostGeoSurface,
  DisplaySurface: DisplayGeoSurface,
  PlayerSurface: PlayerGeoSurface
};
