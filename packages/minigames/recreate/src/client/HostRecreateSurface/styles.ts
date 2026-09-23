// Forgery Studio, host side: a dim gallery back room. Matte frames on the
// pictures, primary for the one thing to press, success for the ticks.
//
// RECREATE is a `<TakeoverStage>` with no deck (docs/takeover-layout-api.md
// §3, §4). Its body is a photograph the host looks at and, beside it, either
// the prompt the team is typing or the prompt the host reads aloud while
// ticking ingredients — every pixel of it is a word or a tap target, so there
// is no corner a floating chip could take. And the bench the §3 table pencilled
// into a 330px deck is the WIDER of the two columns, not a sidebar: the
// ingredient toggles alone want two 56px columns. So the body keeps its own
// 2fr/3fr split and the deck slot stays empty.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock. Gone with the layout: this file's own `p-5` inside the shell's
// gutter, the `header` strip and its `pr-[clamp(9rem,15vw,12rem)]` reserve for
// a clock RECREATE has never had (`timerKey: null`), the team line that said a
// second time what the shell's mini-rail says once, and the
// `w-[calc(100%-4.5rem)]` cap T1.8 hand-typed onto "Next target" — that button
// is in the foot row now, and the row's gutter is the layout's (§6).

// Intro renders inside the host's own control deck, where `rail` and `clock`
// are both null, so it draws neither and keeps its own content height.
export const introRoot = "flex flex-col gap-4";

export const introCard = "max-w-3xl text-sm leading-6 text-muted";

// The rail row's read-only count (§4, `counter`). "Target 2 of 3" was the one
// thing worth keeping off the header strip this file no longer draws: a number
// the host glances at, never presses. A direct child of the row, so it hugs
// itself and sits between the rail's pills and the clock slot RECREATE leaves
// empty.
export const counter =
  "inline-flex shrink-0 items-center rounded-full border border-text/10 bg-surface px-3.5 py-1.5 text-[clamp(0.72rem,0.85vw,0.85rem)] font-semibold uppercase tracking-[0.2em] text-muted";

// An empty prompt bank. It stands in for the whole bench, so it fills the body
// rather than leaving the canvas empty on the one beat that is already a fault.
export const statusNote =
  "flex h-full min-h-0 items-center justify-center rounded-md border border-text/10 bg-surface px-4 py-3 text-center text-sm italic text-text/85";

// The body slot, filled edge to edge. Pictures left, bench right, on all three
// beats — writing, judging and scored — so the host's eye never moves house
// mid-turn. It used to be `md:items-start`, which let both columns sit at their
// content height and left 269px of dead air under them; `h-full` with stretched
// items is what turns that air into photograph.
export const bench = "grid h-full min-h-0 gap-4 md:grid-cols-[2fr_3fr]";

// The scored beat's right column, where the composer and the bench were. The
// seal and the real prompt used to be a row wedged under the pictures with the
// 3fr column standing empty beside them; centred in that column they are the
// reveal the beat is for.
export const reveal = "flex h-full min-h-0 flex-col items-start justify-center gap-5";

export const pointsSeal =
  "flex h-24 w-24 rotate-6 flex-col items-center justify-center rounded-full border-4 border-primary text-primary";

export const pointsSealValue = "text-3xl font-black leading-none";

export const pointsSealLabel = "mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.3em]";

export const revealPromptBlock = "flex min-w-0 flex-col gap-1";

export const revealLabel = "m-0 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted";

export const revealPrompt = "m-0 text-xl italic leading-snug text-text";

// The foot row (§4, `actions`). One beat-ender per beat and always in the same
// place: "Send to the forger" while they write, "Lock in the score" while the
// host grades, "Next target" once it is scored. Three buttons, never two at
// once, so the host learns one corner of the tablet rather than three.
//
// The layout gives this row the dock gutter as right padding, which is what
// retired the `w-[calc(100%-4.5rem)]` on "Next target": the width these buttons
// get has already been shortened for the corner.
export const verdictRow = "grid gap-3 sm:grid-cols-[2fr_1fr]";

const beatButtonBase =
  "min-h-[clamp(56px,9vh,76px)] w-full rounded-md border-2 px-5 font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40";

export const beatButton = `${beatButtonBase} border-primary bg-primary/15 text-base tracking-[0.2em] text-primary hover:bg-primary/25`;

// "Let them rewrite" is the redo hatch (AGENTS.md §11) and rides beside the
// lock, quieter than it and never in front of it.
export const beatButtonQuiet = `${beatButtonBase} border-text/20 bg-surface text-sm font-bold tracking-[0.16em] text-text hover:bg-surface/60`;

// The spent turn takes the beat-ender's place rather than sitting above it
// greyed out, and at the same height, so nothing jumps when the last target is
// scored.
export const turnCompleteNote =
  "flex min-h-[clamp(56px,9vh,76px)] items-center justify-center rounded-md border border-primary/25 bg-primary/10 px-5 text-center text-base font-medium text-text/85";
