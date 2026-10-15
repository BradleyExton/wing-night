import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayMountSurface } from "./DisplayMountSurface/index.js";
import { HostMountSurface } from "./HostMountSurface/index.js";

export const mountRendererBundle: MinigameRendererBundle = {
  HostSurface: HostMountSurface,
  DisplaySurface: DisplayMountSurface
};
