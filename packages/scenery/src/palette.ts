import type { AllandaleStationPalette } from "./AllandaleStation/index.js";
import type { MarinaPalette } from "./Marina/index.js";
import type { SpiritCatcherPalette } from "./SpiritCatcher/index.js";
import type { TownClusterPalette } from "./TownCluster/index.js";

/**
 * Every colour the four landmarks ask for, in one object, so a scene can name its whole
 * waterfront once and hand the same palette to each of them. Each landmark reads only its own
 * slice, so a scene that stands only some of them need build only those slices.
 */
export type SceneryPalette = SpiritCatcherPalette &
  TownClusterPalette &
  AllandaleStationPalette &
  MarinaPalette;
