import type { AllandaleStationPalette } from "./AllandaleStation/index.js";
import type { CrossoversPalette } from "./Crossovers/index.js";
import type { MarinaPalette } from "./Marina/index.js";
import type { QueensHotelPalette } from "./QueensHotel/index.js";
import type { SouldiersSkateShopPalette } from "./SouldiersSkateShop/index.js";
import type { SpiritCatcherPalette } from "./SpiritCatcher/index.js";
import type { StorefrontsPalette } from "./Storefronts/index.js";
import type { TownClusterPalette } from "./TownCluster/index.js";
import type { WaterfrontCondosPalette } from "./WaterfrontCondos/index.js";

/**
 * Every colour the four waterfront landmarks ask for, in one object, so a scene can name its
 * whole waterfront once and hand the same palette to each of them. Each landmark reads only its
 * own slice, so a scene that stands only some of them need build only those slices.
 */
export type SceneryPalette = SpiritCatcherPalette &
  TownClusterPalette &
  AllandaleStationPalette &
  MarinaPalette;

/**
 * The waterfront's palette and everything the rest of the city asks for on top of it: Dunlop
 * Street's fronts, the Queen's, Souldiers, Crossover's and the condos. Kept apart from
 * `SceneryPalette` so a scene that stands only the waterfront is not made to name colours for
 * buildings it never draws. Where two buildings are made of the same stuff they share a slot —
 * Souldiers and Crossover's are both `brick`, the Queen's and a Dunlop front are both `buff` —
 * and every sign's paint is a slot of its own, so a dusk that puts the walls in silhouette can
 * still leave the signs lit.
 */
export type CityPalette = SceneryPalette &
  SouldiersSkateShopPalette &
  QueensHotelPalette &
  CrossoversPalette &
  WaterfrontCondosPalette &
  StorefrontsPalette;
