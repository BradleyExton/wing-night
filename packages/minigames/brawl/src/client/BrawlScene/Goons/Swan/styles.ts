// A goon never takes the pointer: the tablet's thumb zones are the whole canvas.
export const root = "pointer-events-none";

// The swan's line work in its own drawing units; its colours are the palette's. It is drawn a
// little heavier than the goose because it is white on a dark street and the outline is what cuts
// it out of the lamplight; the far leg and the far wing sit behind the near ones at 70% the way
// the cast hen's far leg does (DESIGN.md §2.8).
export const outline = "[stroke-width:0.42] [stroke-linejoin:round]";

// The bill's edge is thinner than the body's: the mandibles are slivers.
export const bill = "[stroke-width:0.18] [stroke-linejoin:round]";

export const leg = "fill-none [stroke-width:0.6] [stroke-linecap:round] [stroke-linejoin:round]";

export const farLeg = "opacity-70";

export const farWing = "opacity-70";

// The one shade the white bird gets: a crescent of grey along the belly, so the hull reads round.
export const shade = "opacity-25";

export const mark = "fill-none [stroke-width:0.3] [stroke-linecap:round]";
