export * from "../../styles.js";

// The body's ink outline, restroked over the sash so the body clip never eats
// it: round, or mitered on the spiky body.
export const bodyEdge = "fill-none stroke-bg stroke-2 [stroke-linejoin:round]";

export const bodyEdgeMitered = "fill-none stroke-bg stroke-2 [stroke-linejoin:miter]";

// A white band keeps a 2.4u ink outline (about 2u shows inside the body clip
// at its sides); an ink band needs none on any team colour.
export const whiteBand = "fill-text stroke-bg [stroke-width:2.4] [stroke-linejoin:round]";
