// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The cone handle's thin outline, the ink collar band and the egg's edge,
// which the harness left at the default join.
export const handleEdge = "stroke-bg [stroke-width:1.6] [stroke-linejoin:round]";

export const collarBand = "fill-bg stroke-bg [stroke-width:0.6] [stroke-linejoin:round]";

export const eggEdge = "stroke-bg stroke-2";

export const cable = "fill-none stroke-bg [stroke-width:2.2] [stroke-linecap:round] [stroke-linejoin:round]";
