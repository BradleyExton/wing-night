import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayFappySurface } from "./DisplayFappySurface/index.js";
import { HostFappySurface } from "./HostFappySurface/index.js";

export const fappyRendererBundle: MinigameRendererBundle = {
  HostSurface: HostFappySurface,
  DisplaySurface: DisplayFappySurface
};

// The relay clock's face, for a surface outside the package that reports a finish (the online
// teaser's end-of-relay card) in the same m:ss.t the relay was flown to.
export { formatRelayClock } from "./useRelayClock/index.js";
