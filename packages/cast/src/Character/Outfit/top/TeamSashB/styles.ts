export * from "../../styles.js";

// The body's ink outline, restroked over the sash so the body clip never eats
// it: round, or mitered on the spiky body.
export const bodyEdge = "fill-none stroke-bg stroke-2 [stroke-linejoin:round]";

export const bodyEdgeMitered = "fill-none stroke-bg stroke-2 [stroke-linejoin:miter]";

// White: the band and the knot share one 4.8u ink stroke, so the knot is a
// cinch on the band, never an oval in its own ring; the tails have their own
// 2.4u edge.
export const sharedEdge = "fill-none stroke-bg [stroke-width:4.8] [stroke-linejoin:round]";

export const whiteTail = "fill-text stroke-bg [stroke-width:2.4] [stroke-linejoin:round]";

// Ink: each tail keeps a 1.6u team-colour rim under its fill, and the knot is
// two team-colour cinch lines across the band.
export const inkTail = "fill-bg stroke-current [stroke-width:3.2] [stroke-linejoin:miter] [paint-order:stroke]";

export const cinch = "fill-none stroke-current [stroke-width:1.6]";
