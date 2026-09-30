import type { SpiritCatcherPalette } from "./SpiritCatcher/index.js";
import type { TownClusterPalette } from "./TownCluster/index.js";

/**
 * Every colour the Spirit Catcher and the town behind it ask for, in one object, so a scene that
 * stands both — JOUST's beach, at dusk — can name its waterfront once and hand the same palette
 * to each. Each landmark reads only its own slice.
 */
export type SceneryPalette = SpiritCatcherPalette & TownClusterPalette;
