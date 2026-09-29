import { takeoverLabel, takeoverLabelAccent } from "@wingnight/surface";

// The subject card is the deck's headline (DESIGN.md §2.6): DRAWING's prompt
// card — serif italic on a `surfaceAlt` → `surface` panel inside a gold-toned
// border — grown to take whatever height the verdicts leave, with the clue the
// TV is mirroring under the subject it is a clue for.
export const card =
  "flex min-h-[15rem] flex-1 flex-col overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-surfaceAlt to-surface";

// The intro beat has no clue yet and sits in the host's own control deck, so
// the card hugs its subject there instead of stretching.
export const cardIntro =
  "flex flex-col overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-surfaceAlt to-surface";

// Re-keyed on every new subject, so a Got it or a Skip visibly deals the next
// card rather than swapping a word in place.
export const subjectHead =
  "flex flex-1 flex-col items-center justify-center gap-1 px-4 py-4 text-center motion-safe:[animation:heroReveal_420ms_cubic-bezier(0.2,1.2,0.4,1)_both]";

export const subjectLabel = takeoverLabelAccent;

const subjectValueBase =
  "font-voice font-bold italic leading-[1.05] text-text [overflow-wrap:anywhere] [text-wrap:balance]";

// Read at arm's length while the host's other hand is on the grid, so the name
// is as big as the column allows: a short name fills it, a long title steps
// down rather than wrapping to four lines.
export const subjectValueFor = (subjectText: string): string => {
  const length = subjectText.length;

  if (length <= 6) {
    return `${subjectValueBase} text-[4.4rem]`;
  }

  if (length <= 9) {
    return `${subjectValueBase} text-[3.6rem]`;
  }

  if (length <= 14) {
    return `${subjectValueBase} text-[2.9rem]`;
  }

  if (length <= 24) {
    return `${subjectValueBase} text-[2.3rem]`;
  }

  return `${subjectValueBase} text-[1.8rem]`;
};

export const subjectWaiting =
  "font-voice text-[1.6rem] font-bold italic text-muted";

// The clue so far, under a rule — the tablet's copy of what the TV shows, but
// all of it: the TV keeps only the last six up.
export const clueWell =
  "flex min-h-0 shrink-0 flex-col gap-1.5 border-t border-text/10 bg-bg/40 px-3 pb-3 pt-2";

export const clueHeader = "flex items-center justify-between";

export const clueLabel = takeoverLabel;

export const clueCount = "font-score text-[0.95rem] tabular-nums text-muted";

export const clue =
  "flex max-h-[8.5rem] min-h-[2.6rem] flex-wrap content-start items-center gap-x-0.5 gap-y-1 overflow-y-auto text-[1.9rem] leading-none";

// Mount-only: an emoji already in the clue keeps its key, so only the one just
// tapped pops.
export const clueEmoji = "motion-safe:[animation:emojipop_300ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const clueEmpty = "flex min-h-[2.6rem] items-center text-sm font-medium text-muted";
