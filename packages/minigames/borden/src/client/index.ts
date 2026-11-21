import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBordenSurface } from "./DisplayBordenSurface/index.js";
import { HostBordenSurface } from "./HostBordenSurface/index.js";

export { CrewPhoneBordenSurface, type CrewPhoneBordenSurfaceProps } from "./CrewPhoneBordenSurface/index.js";

export const bordenRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBordenSurface,
  DisplaySurface: DisplayBordenSurface
};
