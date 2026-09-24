// The city's landmarks, drawn once and stood in more than one game. Every component here is a
// bare <g> placed by `x` and `baseY` in the caller's own world units, and it carries no colour of
// its own: the caller hands it a palette, so SCHLONIC stands the same Spirit Catcher in its
// morning haze that JOUST stands in dusk silhouette (DESIGN.md §2.7, §2.11). Nothing here is a
// surface a runner or a shot can touch — it is backdrop, and it stays hazed, flat and quiet so a
// bird in front of it still wins the eye.
export { AllandaleStation, type AllandaleStationPalette } from "./AllandaleStation/index.js";
export { Marina, type MarinaPalette } from "./Marina/index.js";
export { SpiritCatcher, type SpiritCatcherPalette } from "./SpiritCatcher/index.js";
export { TownCluster, type TownClusterPalette } from "./TownCluster/index.js";
export type { SceneryPalette } from "./palette.js";
