// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The ribbon's outside edge, drawn under its fill so only the silhouette inks.
export const ribbonEdge = "stroke-bg [stroke-width:3.2] [stroke-linejoin:round]";

// The baton: a white stick on a 5.3 ink stick, so it reads light with an edge.
export const batonEdge = "fill-none stroke-bg [stroke-width:5.3] [stroke-linecap:round]";

export const baton = "fill-none stroke-text [stroke-width:2.5] [stroke-linecap:round]";
