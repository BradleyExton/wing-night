export const container = "flex flex-col gap-3";

export const sectionLabel =
  "m-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted";

export const teamPrompt =
  "m-0 rounded-md border border-text/10 bg-surface px-4 py-3 text-lg italic leading-snug text-text";

export const attemptNote = "m-0 text-sm italic text-muted";

export const checklist = "m-0 grid list-none gap-2 p-0 sm:grid-cols-2";

const ingredientBase =
  "flex min-h-14 w-full items-center gap-3 rounded-md border-2 px-4 text-left text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

export const ingredient = `${ingredientBase} border-text/10 bg-text/[0.04] text-text hover:bg-text/[0.08]`;

// Functional success per DESIGN.md §0.1: a tick is a scored answer.
export const ingredientChecked = `${ingredientBase} border-success/70 bg-success/20 text-text`;

export const ingredientMark =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-sm font-black";

export const tally = "m-0 text-sm font-bold uppercase tracking-[0.18em] text-primary";

export const actions = "grid gap-3 sm:grid-cols-[2fr_1fr]";

export const lockButton =
  "min-h-14 rounded-md border-2 border-primary bg-primary/15 px-5 text-base font-black uppercase tracking-[0.2em] text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40";

export const retryButton =
  "min-h-14 rounded-md border-2 border-text/20 bg-surface px-5 text-sm font-bold uppercase tracking-[0.16em] text-text transition hover:bg-surface/60 disabled:cursor-not-allowed disabled:opacity-40";
