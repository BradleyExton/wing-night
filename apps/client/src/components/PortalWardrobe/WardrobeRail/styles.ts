// The rail: the kit, then the showpieces, each group under its one line; in a group a slot is
// its name over a three-across grid of square tiles, the worn one ringed in `primary`, and the
// worn item's style swatches beside the name (the tiles are mockups/cast/wardrobe-picker.html's;
// the page departs from its tabs).
export const rail = "flex flex-col gap-5";

export const group = "flex flex-col gap-3";

export const groupNote = "m-0 text-[0.75rem] leading-snug text-mutedWarmDim";

export const slot = "flex flex-col gap-1";

// As tall as a swatch whether or not the item on has any, so choosing one never moves the grid.
export const slotHead = "flex min-h-[44px] items-center justify-between gap-3";

export const slotName = "m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.3em] text-mutedWarm";

export const grid = "grid grid-cols-3 gap-2";

const tileBase =
  "relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-[radial-gradient(ellipse_at_50%_70%,theme(colors.primary/16%)_0%,transparent_75%)] p-0 transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const tile = `${tileBase} border-ember/20`;

export const tileOn = `${tileBase} border-primary ring-2 ring-primary`;

export const none = "text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-mutedWarm";

export const moveName =
  "pointer-events-none absolute inset-x-0 bottom-1 truncate px-1 text-center text-[0.62rem] font-bold text-text [text-shadow:0_1px_2px_theme(colors.shade)]";

export const shared =
  "pointer-events-none absolute bottom-1 left-1.5 text-[0.5rem] font-bold uppercase tracking-[0.14em] text-mutedWarmDim";

export const styleRow = "flex items-center gap-2";

const swatchBase =
  "h-11 w-11 flex-none cursor-pointer rounded-full border-2 border-text/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const swatch = swatchBase;

export const swatchOn = `${swatchBase} [box-shadow:0_0_0_2px_theme(colors.bg),0_0_0_4px_theme(colors.primary)]`;

// A swatch is the style's own paint, as the cast's Outfit/styles fills it: the outline ink, the
// house white, the wearer's team colour (the row carries it as `currentColor`), the gold token.
export const swatchInk = "bg-bg";

export const swatchWhite = "bg-text";

export const swatchTeam = "bg-current";

export const swatchGold = "bg-wardrobeGold";
