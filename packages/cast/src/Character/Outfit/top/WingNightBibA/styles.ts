export * from "../../styles.js";

// The body's ink outline, restroked over the bib so the body clip never eats
// it: round, or mitered on the spiky body.
export const bodyEdge = "fill-none stroke-bg stroke-2 [stroke-linejoin:round]";

export const bodyEdgeMitered = "fill-none stroke-bg stroke-2 [stroke-linejoin:miter]";

// Each sauce part's 1.2u ember rim, under its team-colour fill.
export const sauceRim = "fill-current stroke-ember [stroke-width:2.4] [stroke-linejoin:round]";
