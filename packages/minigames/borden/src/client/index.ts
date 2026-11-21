import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBordenSurface } from "./DisplayBordenSurface/index.js";
import { HostBordenSurface } from "./HostBordenSurface/index.js";

// PLACEHOLDER surfaces until the phone surface step (spec §0.7 step 6) lands the real ones.
export const bordenRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBordenSurface,
  DisplaySurface: DisplayBordenSurface
};
