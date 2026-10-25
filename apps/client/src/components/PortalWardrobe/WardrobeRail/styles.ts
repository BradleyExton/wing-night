// The rail: tabs that stick, a three-across grid of square tiles, the worn one ringed in
// `primary`, and the style swatches under it (mockups/cast/wardrobe-picker.html).
export const rail = "flex flex-col gap-3";

// The tabs stick to the top of the screen, over the page's own `bg`, so the grid scrolls under them.
// Seven across a 390px phone is 45px a tab only with the gaps and the inset this tight: at the
// card's own 16px and a 4px gap they come out at 43, under a thumb.
export const tabs =
  "sticky top-0 z-10 -mx-4 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-0.5 bg-bg/95 px-3 py-2 [box-shadow:0_8px_16px_-12px_theme(colors.shade)]";

const tabBase =
  "relative inline-flex min-h-[44px] min-w-0 items-center justify-center rounded-lg border px-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const tab = `${tabBase} border-ember/25 bg-surface/50 text-mutedWarm`;

export const tabOn = `${tabBase} border-primary bg-primary/15 text-text`;

export const tabDot =
  "absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary [box-shadow:0_0_6px_theme(colors.primary/70%)]";

export const tabNote = "-mt-1 m-0 text-[0.75rem] leading-snug text-mutedWarmDim";

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

export const styleRow = "flex items-center gap-3";

export const stylesLabel = "text-[0.68rem] font-extrabold uppercase tracking-[0.3em] text-mutedWarm";

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
