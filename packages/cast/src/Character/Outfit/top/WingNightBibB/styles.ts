export * from "../../styles.js";

// The body's ink outline, restroked over the bib so the body clip never eats
// it: round, or mitered on the spiky body.
export const bodyEdge = "fill-none stroke-bg stroke-2 [stroke-linejoin:round]";

export const bodyEdgeMitered = "fill-none stroke-bg stroke-2 [stroke-linejoin:miter]";

// A 2.6u ink underlay, so the splat always has a solid ink silhouette.
export const sauceUnderlay = "fill-bg stroke-bg [stroke-width:2.6] [stroke-linejoin:round]";

// The paper's own back edge and hem, heavier than the house 2u so the paper
// holds on chrome.
export const paperEdge = "fill-none stroke-bg [stroke-width:2.6] [stroke-linejoin:round]";

export const tie = "fill-none stroke-bg [stroke-width:1.4] [stroke-linecap:round]";
