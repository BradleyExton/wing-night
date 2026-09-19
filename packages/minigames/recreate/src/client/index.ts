import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayRecreateSurface } from "./DisplayRecreateSurface/index.js";
import { HostRecreateSurface } from "./HostRecreateSurface/index.js";

export const recreateRendererBundle: MinigameRendererBundle = {
  HostSurface: HostRecreateSurface,
  DisplaySurface: DisplayRecreateSurface
};
