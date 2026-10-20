import type { OutfitStyle } from "@wingnight/shared";

// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The boa is all stroke, so its colour is the style as a stroke.
export const styleStroke: Record<OutfitStyle, string> = {
  ink: "stroke-bg",
  white: "stroke-text",
  team: "stroke-current",
  gold: "stroke-wardrobeGold"
};

export const ropeCasing = "fill-none stroke-bg [stroke-width:6.6] [stroke-linecap:round] [stroke-linejoin:round]";

export const fluffCasing = "fill-none stroke-bg [stroke-width:12.5] [stroke-dasharray:0_5.5] [stroke-linecap:round]";

export const rope = "fill-none [stroke-width:3.8] [stroke-linecap:round] [stroke-linejoin:round]";

export const fluff = "fill-none [stroke-width:9.6] [stroke-dasharray:0_5.5] [stroke-linecap:round]";
