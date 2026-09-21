// Play-phase takeover owns the whole host canvas (DESIGN.md §2.0A): clue
// canvas and picker on the left, subject card and verdicts in the deck column
// on the right. Intro phase degrades to a plain stack inside the deck.
export const container = "flex h-full min-h-0 flex-col gap-[clamp(0.75rem,1.6vh,1.25rem)]";

export const description = "max-w-3xl text-sm leading-6 text-muted";

export const meta = "flex flex-wrap gap-2";

export const metaBlock =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-text/10 bg-surface px-4 py-2";

export const metaLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted";

export const metaValue = "text-sm font-semibold text-text";

export const playArea =
  "grid min-h-0 w-full flex-1 gap-[clamp(0.6rem,1.2vw,1.1rem)] lg:grid-cols-[1fr_clamp(240px,25vw,330px)]";

export const pickerColumn = "flex min-h-0 flex-col gap-[clamp(0.5rem,1vh,0.8rem)]";

export const deckColumn = "flex min-h-0 flex-col gap-[clamp(0.5rem,1vh,0.8rem)]";

// Clue canvas — the live sequence the TV is mirroring.
export const canvas =
  "flex min-h-[88px] flex-wrap items-center gap-1 rounded-2xl border border-gold/30 bg-surfaceAlt px-4 py-3 text-[clamp(1.5rem,2.8vw,2.4rem)] leading-tight";

export const canvasEmpty =
  "flex min-h-[88px] items-center rounded-2xl border border-dashed border-text/15 bg-surfaceAlt px-4 py-3 text-sm font-medium text-muted";

// Search sits above the tabs and costs only its own row until focused.
export const search =
  "flex min-h-[52px] items-center gap-3 rounded-2xl border-2 border-text/10 bg-surfaceAlt px-4 focus-within:border-primary";

export const searchIcon = "text-lg opacity-70";

export const searchInput =
  "min-w-0 flex-1 bg-transparent text-base font-medium text-text outline-none placeholder:text-muted";

export const searchClearButton =
  "min-h-11 rounded-lg px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted hover:text-gold";

export const tabs = "flex gap-1 overflow-x-auto";

const tabBase =
  "flex min-h-[46px] flex-1 flex-col items-center justify-center gap-0.5 rounded-t-xl border border-b-0 px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.1em] transition";

export const tab = `${tabBase} border-text/10 bg-surface text-muted hover:text-text`;

export const tabActive = `${tabBase} border-gold bg-surfaceAlt text-gold`;

export const tabIcon = "text-lg";

export const grid =
  "grid min-h-0 flex-1 grid-cols-8 content-start gap-1 overflow-y-auto rounded-b-2xl border border-t-0 border-text/10 bg-surfaceAlt p-2 sm:grid-cols-10";

export const gridSection =
  "col-span-full px-1 pb-1 pt-2 text-[0.55rem] font-extrabold uppercase tracking-[0.2em] text-muted";

export const emojiButton =
  "flex aspect-square items-center justify-center rounded-lg bg-text/5 text-[clamp(1.2rem,2.2vw,1.9rem)] transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40";

export const emptyNote =
  "col-span-full px-1 py-6 text-center text-sm font-medium text-muted";

// Subject card reuses DRAWING's prompt-card treatment per DESIGN.md §2.6.
export const subjectCard =
  "rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-4 py-3 text-center";

export const subjectLabel =
  "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const subjectValue =
  "font-serif text-[clamp(1.4rem,2vw,2rem)] font-bold italic text-text";

export const subjectMeta =
  "mt-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted";

// A locked subject drops the tabs and the search with them, so the grid it
// leaves behind is free to draw the few emoji it has as big touch targets.
export const lockedGrid =
  "grid min-h-0 flex-1 grid-cols-4 content-start gap-2 overflow-y-auto rounded-2xl border-2 border-gold/40 bg-surfaceAlt p-3 sm:grid-cols-6";

export const lockedLabel =
  "col-span-full px-1 pb-1 text-center text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-gold";

export const lockedEmojiButton =
  "flex aspect-square items-center justify-center rounded-xl bg-gold/10 text-[clamp(1.8rem,4vw,3rem)] transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40";

export const sectionTitle = "text-lg font-bold text-text";

export const sectionHint = "text-sm text-muted";

const verdictBase =
  "flex min-h-[76px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[clamp(1rem,1.4vw,1.15rem)] font-extrabold uppercase tracking-[0.1em] text-text transition disabled:cursor-not-allowed disabled:opacity-50";

// Functional success/danger per DESIGN.md §0.1 — these buttons score the turn.
export const gotItButton = `${verdictBase} border-success/60 bg-success/20 hover:bg-success/30`;

export const skipButton = `${verdictBase} border-danger/60 bg-danger/20 hover:bg-danger/30`;

export const verdictIcon = "text-2xl leading-none";

export const verdictHint =
  "text-[0.6rem] font-bold uppercase tracking-[0.24em] opacity-80";

// The shell floats the host's corner dock over the bottom-right of the
// takeover canvas (DESIGN.md §2.0A), so the row that reaches that corner
// keeps a gutter clear of it rather than putting a control underneath.
export const utilityRow = "flex gap-2 pr-[4.5rem]";

export const utilityButton =
  "min-h-[52px] flex-1 rounded-xl border border-text/10 bg-surface text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const statusNote =
  "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-text/85";
