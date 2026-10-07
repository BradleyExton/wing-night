// One guest's row: name and address on the left, the sign-in pill on the right, ticks and
// actions below. Rows are divided by the hearth's hairline, not boxed.
export const row = "flex flex-col gap-2 border-t border-ember/15 py-3 first:border-t-0 first:pt-0";

export const top = "flex items-start justify-between gap-3";

export const who = "flex min-w-0 flex-col gap-0.5";

export const name = "truncate text-[1.05rem] font-extrabold text-text";

export const email = "truncate text-[0.8rem] text-mutedWarmDim";

export const ticks = "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] font-semibold";

export const tickOn = "inline-flex items-center gap-1 text-text";

export const tickOff = "inline-flex items-center gap-1 text-mutedWarmDim";

export const tickGlyph = "h-3.5 w-3.5";

export const actions = "grid grid-cols-2 gap-1.5";

export const action =
  "inline-flex min-h-[40px] items-center justify-center rounded-lg border border-ember/30 bg-surface/60 px-2 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-text disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const linkBox = "flex flex-col gap-1.5 rounded-xl border border-primary/40 bg-primary/10 p-2.5";

export const linkRow = "flex gap-1.5";

export const linkInput =
  "min-h-[40px] min-w-0 flex-1 rounded-lg border border-ember/20 bg-bg/80 px-2.5 font-mono text-[0.75rem] text-text";
