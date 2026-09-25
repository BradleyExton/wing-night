import { railCounter, takeoverLabel, takeoverLabelAccent, verdictButtonDanger, verdictButtonSuccess, verdictIcon } from "@wingnight/surface";

// TRIVIA is a `<TakeoverStage>` (docs/takeover-layout-api.md §3): a question
// card and two verdicts, with nothing a floating chip could sit over without
// covering a word the host has to read out loud.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. The rail, the clock, the counter and the 4.5rem bottom-right
// gutter are all the layout's, and a `pr-[4.5rem]` typed into this file would
// be the tenth hand-rolled reserve the layouts exist to abolish (§6).

// The rail row's read-only count (§4, `counter`). A direct child of the row,
// so it hugs itself: an inline-flex chip that shrinks for nothing and sits
// between the rail's own pills and the clock slot that TRIVIA never fills.
export const counter = `${railCounter} text-muted`;

// The intro deck is not a takeover — it is a panel in the host's own control
// deck, where the rail and the clock are both null and the stage hero above
// has already said whose turn it is. A plain stack, so the card below falls
// back to its own content height.
export const introRoot = "flex flex-col gap-4";

export const introDescription = "max-w-3xl text-sm leading-6 text-muted";

// The body slot, filled edge to edge. This is the whole point of the
// migration: the card used to sit at its content height in a `justify-center`
// column and leave 355px of dead air above and below it, which measured out
// at a 36% canvas share — the second worst of the nine.
export const promptCard =
  "flex flex-col overflow-hidden rounded-2xl border border-text/10 bg-gradient-to-br from-surfaceAlt to-surface";

// Only at play. At intro the same card is a deck panel with no definite height
// to fill, and `h-full` there would resolve against nothing.
export const promptCardFill = "h-full min-h-0";

// 3:2. The question is what the host reads out; the answer is what they check
// against. Both are `flex-1`-shaped rather than padded to a fixed height, so
// the card grows into whatever the rail row and the verdicts leave it.
export const promptSection =
  "flex flex-[3] flex-col justify-center border-b border-text/10 px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1rem,2vh,2rem)]";

export const answerSection =
  "flex flex-[2] flex-col justify-center px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1rem,2vh,2rem)]";

export const promptLabel =
  takeoverLabelAccent;

export const answerLabel =
  takeoverLabel;

// Read across a room from a tablet on the table, so it takes the height the
// card now has rather than the height a centred card used to leave it.
export const promptValue =
  "mt-3 text-balance text-[clamp(1.75rem,3.6vw,3.4rem)] font-semibold leading-tight text-text";

export const answerValue =
  "mt-3 text-balance text-[clamp(1.5rem,2.8vw,2.6rem)] font-semibold leading-tight text-text/90";

// An empty prompt bank. It stands in for the card, so it fills the same box
// rather than leaving the canvas half empty on the one beat that is already a
// fault.
export const statusNote =
  "flex h-full min-h-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-center text-base font-medium text-muted";

// The foot row (§4, `actions`). The layout gives this row the dock gutter as
// right padding, which is what moved INCORRECT out from under the corner
// dock's 48px circle — the grid below is free to run to its own full width
// because the width it gets has already been shortened for it.
export const actions = "grid gap-[clamp(0.75rem,1.5vw,1.25rem)] sm:grid-cols-2";

// The house verdict (DESIGN.md §2.0B, "Takeover controls"), at the height the
// foot row gives a host-paced game: the rulings are the whole of this beat.
// CORRECT is rendered first (§4, owner decision P7): the positive verdict is
// the one pressed most, and it is the one that must not be a misclick.
const verdictHeight = "h-[clamp(76px,11vh,96px)]";

export const correctButton = `${verdictButtonSuccess} ${verdictHeight}`;

export const incorrectButton = `${verdictButtonDanger} ${verdictHeight}`;

export { verdictIcon };

// The spent turn takes the verdict buttons' place rather than sitting above
// them greyed out: dimmed CORRECT/INCORRECT still read as controls, and the
// tablet is in the team's hands, so "there is nothing left to press" has to be
// the loudest thing on the canvas. Same row, same height, so the card above
// does not jump when the last question is scored.
export const turnComplete =
  "flex min-h-[clamp(76px,11vh,96px)] flex-col items-center justify-center gap-1 rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-center";

export const turnCompleteTitle =
  "text-[clamp(1rem,1.4vw,1.3rem)] font-extrabold uppercase tracking-[0.12em] text-text";

export const turnCompleteHint = "text-sm font-medium text-text/80";
