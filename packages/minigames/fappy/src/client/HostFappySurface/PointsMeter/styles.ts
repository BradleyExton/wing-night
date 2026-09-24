// The stake, beside the relay clock on the Canvas's chrome row
// (docs/takeover-layout-api.md §5, `counter`). Glass like every chip in that
// row, and the same height, so it costs the corridor nothing: the number sits
// where the count already was and par rides under it inside the pill.
export const container =
  "inline-flex min-h-9 items-baseline gap-2 rounded-full border border-text/10 bg-bg/85 px-3.5 py-1.5 backdrop-blur";

export const points =
  "font-mono text-lg font-black leading-none text-gold [font-variant-numeric:tabular-nums]";

// Past par every tenth of a second is a point leaving the board, so the number
// stops being a promise and starts being a countdown.
export const pointsDraining = "text-heat";

export const parHint = "text-xs uppercase tracking-[0.16em] text-mutedWarmDim";
