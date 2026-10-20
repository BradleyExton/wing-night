// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The bare chest in the V.
export const opening = "fill-current stroke-bg stroke-2 [stroke-linejoin:round]";

// The chain is an ember strand cased in ink, so it survives on the chest.
export const chainCasing = "fill-none stroke-bg [stroke-width:3.8] [stroke-linecap:round] [stroke-linejoin:round]";

export const chain = "fill-none stroke-ember [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]";

export const medallion = "fill-ember stroke-bg [stroke-width:1.6] [stroke-linejoin:round]";
