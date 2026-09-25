import { railCounter, takeoverLabel, takeoverLabelAccent, takeoverSecondary, verdictButtonDanger, verdictButtonSuccess, verdictIcon } from "@wingnight/surface";

// EMOJI_CHARADES is a `<TakeoverStage>` with a deck
// (docs/takeover-layout-api.md §3). The body is a grid of tap targets, so
// there is no corner of it a floating chip could take that is not a button:
// the Canvas test asks whether chrome can float over the body without covering
// something the host must press, and here the answer is no anywhere.
//
// It keeps the deck because this is the one body of the nine that does not
// want more width. The cells are `aspect-square`, so width and cell size move
// together: the 887px the deck leaves puts a whole catalog tab — forty to
// fifty emoji — on screen at 84px a cell, and the full 1229px would blow each
// cell up to 118px and push a row off the bottom. The 330px the deck costs is
// width this body has no use for, and it buys the column where the subject and
// the verdicts sit without costing the grid the height it is actually short of.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter and the 4.5rem gutter are all
// the layout's — the `pr-[4.5rem]` this file used to type on the utility row
// was one of the nine hand-rolled reserves the layouts abolish (§6), and the
// deck's own scroll container carries it now.

// The intro beat is a panel in the host's own control deck rather than a
// takeover — `rail` and `clock` are both null on it — so it draws no chrome
// and lets the stack fall back to its own content height.
export const introRoot = "flex flex-col gap-4";

export const introDescription = "max-w-3xl text-sm leading-6 text-muted";

// The rail row's read-only counts (§4, `counter`). "N subjects left" was the
// third line of the subject card and the points banked this turn were nowhere
// at all; both are glanced at rather than pressed, so both belong here.
const chip = `${railCounter} text-muted`;

export const counter = chip;

export const counterPending = `${railCounter} font-score tabular-nums text-gold`;

// The body slot, filled edge to edge: clue canvas → persistent search → tabs →
// emoji grid, in that order (DESIGN.md §2.6). The height the description
// paragraph and the hand-rolled "Clueing <team>" chip used to eat above it all
// lands in the grid at the bottom.
export const picker = "flex h-full min-h-0 flex-col gap-[clamp(0.5rem,1vh,0.8rem)]";

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
  "min-h-11 rounded-lg px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted hover:text-primary";

export const tabs = "flex gap-1 overflow-x-auto";

const tabBase =
  "flex min-h-[46px] flex-1 flex-col items-center justify-center gap-0.5 rounded-t-xl border border-b-0 px-2 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] transition";

export const tab = `${tabBase} border-text/10 bg-surface text-muted hover:text-text`;

export const tabActive = `${tabBase} border-gold bg-surfaceAlt text-gold`;

export const tabIcon = "text-lg";

export const grid =
  "grid min-h-0 flex-1 grid-cols-8 content-start gap-1 overflow-y-auto rounded-b-2xl border border-t-0 border-text/10 bg-surfaceAlt p-2 sm:grid-cols-10";

export const gridSection =
  `col-span-full px-1 pb-1 pt-2 ${takeoverLabel}`;

export const emojiButton =
  "flex aspect-square items-center justify-center rounded-lg bg-text/5 text-[clamp(1.2rem,2.2vw,1.9rem)] transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40";

export const emptyNote =
  "col-span-full px-1 py-6 text-center text-sm font-medium text-muted";

// Subject card reuses DRAWING's prompt-card treatment per DESIGN.md §2.6.
export const subjectCard =
  "shrink-0 rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-4 py-3 text-center";

export const subjectLabel =
  takeoverLabelAccent;

export const subjectValue =
  "font-voice text-[clamp(1.4rem,2vw,2rem)] font-bold italic text-text";

// A locked subject drops the tabs and the search with them, so the grid it
// leaves behind is free to draw the few emoji it has as big touch targets.
export const lockedGrid =
  "grid min-h-0 flex-1 grid-cols-4 content-start gap-2 overflow-y-auto rounded-2xl border-2 border-gold/40 bg-surfaceAlt p-3 sm:grid-cols-6";

export const lockedLabel =
  "col-span-full px-1 pb-1 text-center text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-gold";

export const lockedEmojiButton =
  "flex aspect-square items-center justify-center rounded-xl bg-gold/10 text-[clamp(1.8rem,4vw,3rem)] transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40";

// The house verdict (DESIGN.md §2.0B, "Takeover controls"), stood up as a card:
// icon over label over the hint. GOT IT is rendered first (§4, owner decision P7).
const verdictCard = "h-[76px] flex-1 flex-col";

export const gotItButton = `${verdictButtonSuccess} ${verdictCard}`;

export const skipButton = `${verdictButtonDanger} ${verdictCard}`;

export { verdictIcon };

export const verdictHint =
  "text-[0.7rem] font-bold uppercase tracking-[0.2em] opacity-80";

export const utilityRow = "flex shrink-0 gap-2";

export const utilityButton = `${takeoverSecondary} h-[52px] flex-1`;

// The two beats with no picker on them. Both stand in for the body rather than
// sitting at the top of an empty one: the deck collapses to nothing when the
// turn is over, so this fills the whole canvas, which is the loudest way to say
// there is nothing left to press while the tablet is still in a team's hands.
export const turnComplete =
  "flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-primary/25 bg-primary/10 px-6 py-5 text-center";

export const turnCompleteTitle =
  "text-[clamp(1.1rem,1.6vw,1.5rem)] font-extrabold uppercase tracking-[0.12em] text-text";

export const turnCompleteHint = "text-sm font-medium text-text/80";

export const waitingNote =
  "flex h-full min-h-0 items-center justify-center rounded-[1.75rem] border border-text/10 bg-surfaceAlt px-6 py-5 text-center text-base font-medium text-muted";
