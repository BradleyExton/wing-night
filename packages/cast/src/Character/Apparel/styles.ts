// Apparel is drawn in the palette the bird already has: white (`text`) for the
// hat, stars and medallion, `bg` for the collar band, and the team colour
// (currentColor) for the hat band, so a prop never adds a colour.
export const light = "fill-text stroke-bg stroke-2 [stroke-linejoin:round]";

// The collar's ink, left BARE. A white rim was tried and rejected: it gives
// the band a lip, and a lipped dark crescent under a beak with white studs
// inside it is a mouth with teeth on every accent, chrome worst of all. The
// band needs no rim anyway — it is `bg` against the body's fill, which is
// full contrast on all eight; the only place it meets the bird's own `bg`
// outline is the silhouette edge, where a seam cannot be seen.
export const dark = "fill-bg";

export const band = "fill-current";

// A collar stud: the bird's own white, with no outline. `light`'s 2-unit `bg`
// stroke would be wider than the stud itself and swallow it.
export const stud = "fill-text";

// The medallion's chain: a drawn line, not a filled shape, so it stays a
// hairline at TV scale instead of thickening into a bib.
export const chain = "fill-none stroke-text [stroke-width:2] [stroke-linecap:round]";
