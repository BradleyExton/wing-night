import { takeoverLabel } from "@wingnight/surface";

// The right-hand column of the takeover body on the judging beat, filling it
// rather than sitting at its content height.
export const container = "flex h-full min-h-0 flex-col gap-3";

export const sectionLabel =
  `m-0 ${takeoverLabel}`;

export const teamPrompt =
  "m-0 rounded-md border border-text/10 bg-surface px-4 py-3 text-lg italic leading-snug text-text";

export const attemptNote = "m-0 text-sm italic text-muted";

// The ticks take the column's slack, because pressing them IS the host's work
// on this beat and a bigger target is a better one. Bounded, though: four
// ingredients in a 622px column would otherwise become two 150px slabs, so the
// rows grow to 88px and no further and the rest of the air falls between the
// last tick and the tally. A long authored list scrolls instead, the rows
// holding their 56px floor (DESIGN.md §2.10).
export const checklist =
  "m-0 grid min-h-0 flex-1 list-none auto-rows-[minmax(3.5rem,5.5rem)] content-start gap-2 overflow-y-auto p-0 sm:grid-cols-2";

// `h-full` so a toggle fills the row the grid gave it; `min-h-14` is the floor
// the row never drops below.
const ingredientBase =
  "flex h-full min-h-14 w-full items-center gap-3 rounded-md border-2 px-4 text-left text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

export const ingredient = `${ingredientBase} border-text/10 bg-text/[0.04] text-text hover:bg-text/[0.08]`;

// Functional success per DESIGN.md §0.1: a tick is a scored answer.
export const ingredientChecked = `${ingredientBase} border-success/70 bg-success/20 text-text`;

export const ingredientMark =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-sm font-black";

export const tally = "m-0 text-sm font-bold uppercase tracking-[0.18em] text-primary";
