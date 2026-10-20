// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The leaf in its style, on a finer 1.6 ink edge.
export const leafEdge = "stroke-bg [stroke-width:1.6] [stroke-linejoin:round]";

// The pleats: white on the ink leaf, ink on a light one.
export const pleatsOnInk = "fill-none stroke-text stroke-2 [stroke-linecap:round]";

export const pleatsOnLight = "fill-none stroke-bg stroke-2 [stroke-linecap:round]";

export const guards = "fill-none stroke-bg [stroke-width:2.5] [stroke-linecap:butt]";
