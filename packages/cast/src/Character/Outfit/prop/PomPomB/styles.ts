// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The cloud's outline is painted under its fill, so the lobe roots stay white.
export const pomEdge = "stroke-bg [stroke-width:2.6] [stroke-linejoin:round] [paint-order:stroke]";

export const stick = "fill-none stroke-bg [stroke-width:2.4] [stroke-linecap:round]";
