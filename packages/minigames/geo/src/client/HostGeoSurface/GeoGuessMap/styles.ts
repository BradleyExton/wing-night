export const root = "relative h-full w-full";

export const map = "h-full w-full";

// Leaflet's own panes sit at z-index 400-1000, so the quick views ride above
// them. Top-right corner — the zoom control owns top-left.
export const viewStrip =
  "absolute right-2 top-2 z-[1000] flex gap-1.5";

export const viewButton =
  "min-h-11 border border-gold/50 bg-surface/90 px-3.5 font-serif text-xs font-bold uppercase tracking-[0.18em] text-gold shadow-md backdrop-blur transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
