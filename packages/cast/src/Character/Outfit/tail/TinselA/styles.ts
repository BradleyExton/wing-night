import type { OutfitStyle } from "@wingnight/shared";

// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The foil is a stroke, so its colour is the style as a stroke.
export const styleStroke: Record<OutfitStyle, string> = {
  ink: "stroke-bg",
  white: "stroke-text",
  team: "stroke-current",
  gold: "stroke-wardrobeGold"
};

// A 3.4 foil core cased 1.2 in ink, mitered so the teeth stay sharp.
export const foilCasing = "fill-none stroke-bg [stroke-width:5.8] [stroke-linecap:round] [stroke-linejoin:miter]";

export const foil = "fill-none [stroke-width:3.4] [stroke-linecap:round] [stroke-linejoin:miter]";

export const sparkleEdge = "stroke-bg stroke-1 [stroke-linejoin:round] [paint-order:stroke]";
