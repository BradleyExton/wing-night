import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplaySchlonicSurface } from "./DisplaySchlonicSurface/index.js";
import { HostSchlonicSurface } from "./HostSchlonicSurface/index.js";

export const schlonicRendererBundle: MinigameRendererBundle = {
  HostSurface: HostSchlonicSurface,
  DisplaySurface: DisplaySchlonicSurface
};
