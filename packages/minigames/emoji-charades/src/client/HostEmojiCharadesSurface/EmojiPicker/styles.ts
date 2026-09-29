import { takeoverLabel } from "@wingnight/surface";

// The whole body slot, edge to edge: search → tabs → grid (DESIGN.md §2.6).
// The clue canvas that used to head it lives under the subject in the deck
// now, so every pixel of the body's height is catalog.
export const root = "flex h-full min-h-0 flex-col gap-2.5";

// Search sits above the tabs and costs only its own row until focused. The
// browser's own clear cross is hidden: the row already has one it can read.
export const search =
  "flex min-h-[3.5rem] shrink-0 items-center gap-3 rounded-2xl border-2 border-text/10 bg-surfaceAlt px-4 transition-colors focus-within:border-primary focus-within:bg-surface";

export const searchIcon = "text-xl opacity-70";

export const searchInput =
  "min-w-0 flex-1 bg-transparent text-[1.1rem] font-medium text-text outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden";

export const searchClearButton =
  "min-h-11 rounded-lg bg-text/5 px-4 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-muted transition hover:text-primary active:scale-95";

export const tabs = "flex shrink-0 gap-1 overflow-x-auto";

const tabBase =
  "flex min-h-[3.1rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-t-xl border border-b-0 px-2 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] transition";

export const tab = `${tabBase} border-text/10 bg-surface text-muted hover:text-text`;

export const tabActive = `${tabBase} border-primary bg-surfaceAlt text-primary`;

export const tabIcon = "text-xl leading-none";

// Search results take the tabs' place under the field and read as one panel
// with it, so the grid's corners follow whichever is showing.
const gridBase =
  "grid min-h-0 flex-1 grid-cols-10 content-start gap-1.5 overflow-y-auto border border-text/10 bg-surfaceAlt p-2 [scrollbar-width:thin]";

export const grid = `${gridBase} rounded-b-2xl border-t-0`;

export const gridSearching = `${gridBase} rounded-2xl`;

export const gridSection = `col-span-full px-1 pb-0.5 pt-2 ${takeoverLabel}`;

// A press answers in the hand: the cell dips and lights before the TV has even
// heard about the tap. Hover only tints where there is a pointer that hovers —
// Android keeps `:hover` stuck on the last cell tapped, which read as a
// selection the picker does not have.
export const emojiButton =
  "flex aspect-square items-center justify-center rounded-xl bg-text/5 text-[2.2rem] leading-none transition duration-100 [@media(hover:hover)]:hover:bg-primary/20 active:scale-90 active:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40";

export const emptyNote =
  "col-span-full px-1 py-8 text-center text-base font-medium text-muted";

// A locked subject drops the tabs and the search with them, so the grid it
// leaves behind is free to draw the few emoji it has as big touch targets.
export const lockedGrid =
  "grid h-full min-h-0 grid-cols-6 content-start gap-2 overflow-y-auto rounded-2xl border-2 border-gold/40 bg-surfaceAlt p-3";

export const lockedLabel =
  "col-span-full px-1 pb-1 text-center text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-primary";

export const lockedEmojiButton =
  "flex aspect-square items-center justify-center rounded-xl bg-primary/10 text-[3rem] leading-none transition duration-100 [@media(hover:hover)]:hover:bg-primary/25 active:scale-90 active:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-40";
