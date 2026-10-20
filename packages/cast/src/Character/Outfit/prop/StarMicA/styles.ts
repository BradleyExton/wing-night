// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The handle's thin outline, so its white core survives at 76, and the ink
// grip collar where it meets the star.
export const handleEdge = "stroke-bg [stroke-width:1.6] [stroke-linejoin:round]";

export const gripCollar = "fill-none stroke-bg [stroke-width:1.6] [stroke-linecap:butt]";
