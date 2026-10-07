// The vote summary: the genre tally as a bar per genre (primary over glass, the leader full
// width), the format counts as figures, then the pairs and the stragglers as plain lines.
export const group = "flex flex-col gap-2 border-t border-ember/15 pt-3";

export const tallies = "m-0 flex list-none flex-col gap-1.5 p-0";

export const tally = "grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2";

export const genre = "truncate text-[0.88rem] font-extrabold uppercase tracking-[0.02em] text-text";

export const track = "relative h-2.5 overflow-hidden rounded-full bg-text/[0.06]";

export const fill = "absolute inset-y-0 left-0 rounded-full bg-primary [box-shadow:0_0_10px_theme(colors.primary/50%)]";

// The fill's width, in tenths of the leader's bar.
export const fillWidths = [
  "w-0",
  "w-[10%]",
  "w-[20%]",
  "w-[30%]",
  "w-[40%]",
  "w-[50%]",
  "w-[60%]",
  "w-[70%]",
  "w-[80%]",
  "w-[90%]",
  "w-full"
] as const;

export const points = "text-right font-score text-[1.15rem] font-extrabold leading-none tabular-nums text-text";

export const formats = "m-0 flex list-none flex-col gap-1 p-0";

export const format = "flex items-baseline justify-between gap-3 text-[0.9rem] text-mutedWarm";

export const formatCount = "font-score text-[1.2rem] font-extrabold tabular-nums text-text";

export const line = "m-0 text-[0.92rem] text-text";

export const names = "m-0 text-[0.9rem] leading-relaxed text-mutedWarm";
