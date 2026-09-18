import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayFappySurface } from "./DisplayFappySurface/index.js";
import { HostFappySurface } from "./HostFappySurface/index.js";

export const fappyRendererBundle: MinigameRendererBundle = {
  HostSurface: HostFappySurface,
  DisplaySurface: DisplayFappySurface
};
