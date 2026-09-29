// The city's landmarks, drawn once and stood in more than one game. Every component here is a
// bare <g> placed by `x` and `baseY` in the caller's own world units, and it carries no colour of
// its own: the caller hands it a palette, so SCHLONIC stands the same Spirit Catcher in its
// morning haze that JOUST stands in dusk silhouette (DESIGN.md §2.7, §2.11). Nothing here is a
// surface a runner or a shot can touch — it is backdrop, and it stays hazed, flat and quiet so a
// bird in front of it still wins the eye.
//
// Dunlop Street stands here too: Souldiers (the start line), the Queen's (the finish), Crossover's
// out on the highway, the twin condos on the water, and a row of generic fronts to stand between
// them. The two set pieces export where their door and their patio are, so a scene can stand a
// runner in the one and a goal post on the other without measuring the drawing.
export { AllandaleStation, type AllandaleStationPalette } from "./AllandaleStation/index.js";
export { CROSSOVERS, Crossovers, type CrossoversPalette } from "./Crossovers/index.js";
export { Marina, type MarinaPalette } from "./Marina/index.js";
export {
  QUEENS_HOTEL,
  QueensHotel,
  resolveQueensPatioX,
  type QueensHotelPalette
} from "./QueensHotel/index.js";
export {
  SOULDIERS_SKATE_SHOP,
  SouldiersSkateShop,
  resolveSouldiersDoorX,
  type SouldiersSkateShopPalette
} from "./SouldiersSkateShop/index.js";
export { SpiritCatcher, type SpiritCatcherPalette } from "./SpiritCatcher/index.js";
export { STOREFRONTS, Storefronts, type StorefrontsPalette } from "./Storefronts/index.js";
export { TownCluster, type TownClusterPalette } from "./TownCluster/index.js";
export {
  WATERFRONT_CONDOS,
  WaterfrontCondos,
  type WaterfrontCondosPalette
} from "./WaterfrontCondos/index.js";
export type { CityPalette, SceneryPalette } from "./palette.js";
