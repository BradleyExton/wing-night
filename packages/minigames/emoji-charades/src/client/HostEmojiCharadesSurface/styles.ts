import { railCounter, takeoverSecondary, verdictButtonDanger, verdictButtonSuccess } from "@wingnight/surface";

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

// The house verdict (DESIGN.md §2.0B, "Takeover controls") at two weights.
// GOT IT is the slab — icon disc, label, hint — because it is the tap a turn is
// made of and it comes first (§4, owner decision P7). SKIP is a strip under it:
// always there, never the thumb's first landing. The layout lives on an inner
// span so it never contends with the token's own flex and gap.
export const gotItButton = `${verdictButtonSuccess} h-[7.5rem] w-full shrink-0`;

export const skipButton = `${verdictButtonDanger} h-[3.75rem] w-full shrink-0`;

export const verdictBody = "flex items-center gap-4";

export const verdictText = "flex flex-col items-start gap-1";

export const gotItIcon =
  "grid h-14 w-14 place-items-center rounded-full bg-success text-[2rem] font-black leading-none text-bg shadow-[0_0_24px_theme(colors.success/45%)]";

export const gotItLabel = "text-[1.9rem] font-black leading-none tracking-[0.08em]";

export const skipIcon =
  "grid h-8 w-8 place-items-center rounded-full bg-danger/80 text-[1.2rem] font-black leading-none text-text";

export const skipLabel = "text-[1.15rem] font-black tracking-[0.12em]";

export const verdictHint =
  "text-[0.7rem] font-bold uppercase tracking-[0.2em] opacity-75";

export const utilityRow = "flex shrink-0 gap-2";

export const utilityButton = `${takeoverSecondary} h-[3.25rem] flex-1`;

// The two beats with no picker on them. Both stand in for the body rather than
// sitting at the top of an empty one: the deck collapses to nothing when the
// turn is over, so this fills the whole canvas, which is the loudest way to say
// there is nothing left to press while the tablet is still in a team's hands.
export const turnComplete =
  "flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-6 py-5 text-center";

export const turnCompleteTitle =
  "text-[clamp(1.1rem,1.6vw,1.5rem)] font-extrabold uppercase tracking-[0.12em] text-text";

export const turnCompleteHint = "text-sm font-medium text-text/80";

export const waitingNote =
  "flex h-full min-h-0 items-center justify-center rounded-2xl border border-text/10 bg-surfaceAlt px-6 py-5 text-center text-base font-medium text-muted";
