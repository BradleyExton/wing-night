import type { MinigameRendererBundle } from "@wingnight/minigames-core";

import { DisplayBrawlSurface } from "./DisplayBrawlSurface/index.js";
export { CrewPhoneBrawlSurface, type CrewPhoneBrawlSurfaceProps } from "./CrewPhoneBrawlSurface/index.js";
// The crew kit Base Borden plays with too (docs/minigames/base-borden-spec.md §0.3): the same two
// thumbs, the same slot colours, each player's own hen, and Barrie's one goose.
export { CrewPad } from "./CrewPad/index.js";
export { CREW_SLOT_COLOURS, crewPadInk, resolveCrewSlotColour } from "./CrewScene/palette.js";
export { GOOSE_ART_HEIGHT, brawlGoonPalette, type BrawlGoonPalette } from "./CrewScene/Goons/index.js";
export { GooseFigure } from "./CrewScene/Goons/GooseFigure/index.js";
export { resolveHenFigure, type HenFigure } from "./resolveHenFigure/index.js";
import { HostBrawlSurface } from "./HostBrawlSurface/index.js";
import { PadBrawlSurface } from "./PadBrawlSurface/index.js";

export const brawlRendererBundle: MinigameRendererBundle = {
  HostSurface: HostBrawlSurface,
  DisplaySurface: DisplayBrawlSurface,
  PadSurface: PadBrawlSurface
};
