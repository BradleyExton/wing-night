// A goon never takes the pointer: the tablet's thumb zones are the whole canvas.
export const root = "pointer-events-none";

// The helmet goose is the goose's own line work (`../GooseFigure/styles.ts`), repeated here
// because the figure is redrawn around a different pose table: the same outline, the bill's
// thinner edge, the heavier legs, the far leg dimmed behind the near one (DESIGN.md §2.8).
export const outline = "[stroke-width:0.4] [stroke-linejoin:round]";

export const bill = "[stroke-width:0.18] [stroke-linejoin:round]";

export const leg = "fill-none [stroke-width:0.55] [stroke-linecap:round] [stroke-linejoin:round]";

export const farLeg = "opacity-70";

export const mark = "fill-none [stroke-width:0.32] [stroke-linecap:round]";
