import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayJoustSurface } from "./DisplayJoustSurface/index.js";
import { HostJoustSurface } from "./HostJoustSurface/index.js";

export const joustRendererBundle: MinigameRendererBundle = {
  HostSurface: HostJoustSurface,
  DisplaySurface: DisplayJoustSurface
};
