// The ranked genres as a numbered stack the thumb reorders with up and down, and the rest as
// dashed chips to tap onto the end of it (an open slot's dashed and dim, from the lobby).
export const list = "m-0 flex list-none flex-col gap-1.5 p-0";

export const item =
  "flex items-center gap-2 rounded-xl border border-ember/20 bg-bg/70 py-1.5 pl-3 pr-1.5";

export const rank = "w-6 flex-none font-score text-[1.4rem] font-extrabold leading-none tabular-nums text-primary";

export const genre = "min-w-0 flex-1 truncate text-[1rem] font-extrabold uppercase tracking-[0.04em] text-text";

export const controls = "flex flex-none gap-1";

export const glyph = "h-5 w-5";

export const chipGlyph = "h-4 w-4";

export const chips = "flex flex-wrap gap-1.5";

export const chip =
  "inline-flex min-h-[40px] items-center gap-1 rounded-full border border-dashed border-mutedWarmDim px-3 text-[0.9rem] font-semibold text-mutedWarm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const empty = "m-0 text-[0.85rem] italic text-mutedWarmDim";
