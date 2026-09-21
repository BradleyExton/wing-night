// Apparel is drawn in the palette the bird already has: white (`text`) for the
// hat, stars and medallion, and the team colour
// (currentColor) for the hat band, so a prop never adds a colour.
export const light = "fill-text stroke-bg stroke-2 [stroke-linejoin:round]";

export const band = "fill-current";

// The medallion's chain: a drawn line, not a filled shape, so it stays a
// hairline at TV scale instead of thickening into a bib.
export const chain = "fill-none stroke-text [stroke-width:2] [stroke-linecap:round]";
