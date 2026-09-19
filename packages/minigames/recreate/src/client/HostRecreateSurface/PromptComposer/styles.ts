export const container = "flex flex-col gap-2";

export const label = "m-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted";

// Tall enough for a paragraph on a tablet keyboard; the textarea itself is
// the biggest touch target on the page.
export const textarea =
  "min-h-[clamp(7rem,18vh,10rem)] w-full resize-none rounded-md border border-text/10 bg-text/[0.04] px-4 py-3 text-lg leading-snug text-text placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const footer = "flex flex-wrap items-center justify-between gap-3";

export const counter = "m-0 text-xs tabular-nums text-muted";

export const submitButton =
  "min-h-14 flex-1 rounded-md border-2 border-primary bg-primary/15 px-5 text-base font-black uppercase tracking-[0.2em] text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40";
