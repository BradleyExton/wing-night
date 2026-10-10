// The team board: the switch on top, then a column per team in seating order, each its wordmark
// over a stack of member rows, and the unseated last. Columns stack on a phone and pair up on
// anything wider. A column wears its team's colour as the rows' tint (the colour variant's own
// class, handed in by the column).
export const switchRow = "flex items-center justify-between gap-3 border-t border-ember/15 pt-3";

const switchBase =
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const switchOpen = `${switchBase} border-primary/50 bg-primary/15 text-text`;

export const switchClosed = `${switchBase} border-text/10 bg-text/[0.05] text-mutedWarmDim`;

export const switchKnob = "h-[0.6em] w-[0.6em] rounded-full bg-primary [box-shadow:0_0_8px_theme(colors.primary/70%)]";

export const switchKnobOff = "h-[0.6em] w-[0.6em] rounded-full bg-mutedWarmDim";

export const columns = "grid grid-cols-1 gap-3 sm:grid-cols-2";

export const column = "relative isolate flex flex-col gap-1.5 overflow-hidden rounded-xl border border-ember/20 bg-bg/60 p-2.5";

export const columnWash = "pointer-events-none absolute inset-0 -z-10";

export const columnHead = "flex items-baseline justify-between gap-2";

// TeamWordmark is inline by design; the box is the column's to give.
export const teamName = "block min-w-0 flex-1 truncate text-[1.1rem] leading-none";

export const teamNamePlain = "block min-w-0 flex-1 truncate text-[1rem] font-black uppercase text-text";

export const seats = "flex-none font-score text-[1.2rem] font-extrabold leading-none tabular-nums text-text";
