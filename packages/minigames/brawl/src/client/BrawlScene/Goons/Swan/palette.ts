// What the swan needs that the goon palette (`../palette.ts`) does not carry. A class name on the
// house tokens like every other goon colour, never a hex. The swan is white (`palette.plumage`),
// its bill is the house orange (`palette.beak`), its knob and face patch are the goose's own
// black (`palette.neck`) — the one thing it has of its own is its legs, which on a mute swan are a
// dark grey the goose's `stroke-bg` would lose against the night street.
//
// Merged into `brawlGoonPalette` (`../palette.ts`), which is what the swan is handed: the value
// is written here, beside the drawing that uses it, and nowhere else.
export type BrawlSwanPalette = {
  /** The swan's legs and feet, as a stroke: a dark grey that still shows on the pavement. */
  swanLegs: string;
};

export const brawlSwanPalette: BrawlSwanPalette = {
  swanLegs: "stroke-muted"
};
