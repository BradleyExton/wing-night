// The goose's line work. Its colours are the palette's (`../palette.ts`); what is here is how the
// lines are drawn, in the goose's own drawing units: an outline thin enough to leave a 12-unit
// goose its shape, legs a touch heavier so the walk reads, and the far leg dimmed behind the near
// one the way the cast hen's is (DESIGN.md §2.8).
export const outline = "[stroke-width:0.4] [stroke-linejoin:round]";

// The bill's edge is half the body's: the mandibles are slivers, and a full outline paints them out.
export const bill = "[stroke-width:0.18] [stroke-linejoin:round]";

export const leg = "fill-none [stroke-width:0.55] [stroke-linecap:round] [stroke-linejoin:round]";

export const farLeg = "opacity-70";

export const mark = "fill-none [stroke-width:0.32] [stroke-linecap:round]";

export const link = "[stroke-width:0.15]";
