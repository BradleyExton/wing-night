import type { SpiritCatcherPalette } from "@wingnight/scenery";

// The waterfront at dusk (DESIGN.md §2.11's licence for scene art, on the house tokens). Every
// value is a custom property the scene's root sets from the theme (`styles.ts`), because the
// scenery takes its colours as presentation attributes and a class cannot reach one. No hex lives
// in the scene. The hens are their teams' colours and the goose has its own classes
// (`Goose/styles.ts`); this is only the place they stand in.
export const mountDusk = {
  water: "var(--mt-water)",
  glint: "var(--mt-glint)",
  shore: "var(--mt-shore)",
  ground: "var(--mt-ground)",
  groundEdge: "var(--mt-ground-edge)",
  plank: "var(--mt-plank)",
  stone: "var(--mt-stone)",
  stoneDark: "var(--mt-stone-dark)",
  stoneEdge: "var(--mt-stone-edge)",
  steel: "var(--mt-steel)",
  steelDark: "var(--mt-steel-dark)",
  mound: "var(--mt-mound)",
  shadow: "var(--mt-shadow)"
} as const;

/** The Spirit Catcher on the far shore, a silhouette against the dusk. */
export const DUSK_SPIRIT_CATCHER: SpiritCatcherPalette = {
  steel: mountDusk.steel,
  steelDark: mountDusk.steelDark,
  mound: mountDusk.mound
};
