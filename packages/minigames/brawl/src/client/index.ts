import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBrawlSurface } from "./DisplayBrawlSurface/index.js";
export { CrewPhoneBrawlSurface, type CrewPhoneBrawlSurfaceProps } from "./CrewPhoneBrawlSurface/index.js";
import { HostBrawlSurface } from "./HostBrawlSurface/index.js";
import { PadBrawlSurface } from "./PadBrawlSurface/index.js";

export const brawlRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBrawlSurface,
  DisplaySurface: DisplayBrawlSurface,
  PadSurface: PadBrawlSurface
};
