import { takeoverLabelAccent, takeoverSecondary, verdictButtonDanger, verdictButtonSuccess, verdictIcon } from "@wingnight/surface";

// DRAWING is a `<TakeoverStage>` with no deck (docs/takeover-layout-api.md §3).
// The board is not floatable-over: it is the one body on the tablet that the
// host both reads AND presses, every pixel of it, so a floating toolbar does
// not cost a corner of scenery — it covers the drawing and arms CLEAR under
// the artist's hand.
//
// Everything here is shaped by one fact: the board letterboxes to 16:10
// against the HEIGHT the rows leave it, so board width is 1.6x whatever height
// the chrome gives back and side width is free. Rows are expensive, columns are
// not. That is why the prompt rides the rail row rather than a card of its own,
// why the toolbar lost its panel, and why the ink palette costs nothing.
//
// Nothing here positions the takeover's chrome and nothing here reserves the
// corner dock: the rail, the clock, the counter's place in the row and the
// 4.5rem bottom-right gutter are all the layout's, and the `pr-[4.5rem]` this
// file used to carry was one of the nine hand-rolled reserves §6 abolishes.

// The intro beat is a panel in the host's own control deck, not a takeover —
// `rail` and `clock` are both null on it — so it draws no chrome and falls back
// to its own content height.
export const introRoot = "flex flex-col gap-4";

export const introCard =
  "rounded-2xl border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-5 py-4 text-base leading-6 text-text/90";

// The rail row (§4, `counter`), read-only: the prompt the artist is drawing and
// the points riding on it. The prompt is not a count, but it is the turn's one
// glance-at-without-acting read, and the rail row is free real estate here —
// DRAWING is one of the three games with a play clock, and the clock chip is
// 48px tall, so anything shorter than that in this row costs the board nothing
// at all. A card of its own would cost a row, and a row costs 1.6 rows of board.
//
// `whitespace-nowrap` on purpose: a wrapped prompt grows the rail row, and this
// is the one surface where a second line of chrome is paid for in board area.
export const counterPrompt =
  "inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border-2 border-gold bg-gradient-to-b from-surfaceAlt to-surface px-4 py-1";

export const counterPromptLabel =
  takeoverLabelAccent;

export const counterPromptText =
  "m-0 font-serif text-[clamp(1.2rem,1.9vw,1.6rem)] font-bold italic leading-tight text-text";

export const counterPending =
  "shrink-0 text-right font-mono text-sm font-extrabold text-gold";

// The body. Ink rail down the left, board taking the rest. Measured at
// 1280x800: the board comes out 984px wide inside a 1151px easel slot, so the
// palette column sits entirely inside slack the board was never going to use —
// removing it would not widen the board by a pixel.
export const easelRow = "flex h-full min-h-0 gap-[clamp(0.35rem,0.8vw,0.6rem)]";

export const inkRail =
  "flex h-fit w-[4.25rem] shrink-0 flex-col items-center gap-2 self-center rounded-2xl border border-text/10 bg-surface px-2 py-2.5";

// The booth's sign, at the head of the palette post. §4 keeps a game's own
// names out of the rail row, and this surface has no row to spare for one, so
// the name lives on the easel furniture where the letterbox pays for it.
export const boothPlate =
  "text-center text-[0.62rem] font-extrabold uppercase leading-[1.35] tracking-[0.18em] text-primary";

export const boothPlateRule = "h-px w-8 bg-gold/30";

export const easelArea = "relative min-h-0 min-w-0 flex-1";

// Transient (2s) result line, floated over the board rather than holding a row
// of its own in the layout.
export const revealLine =
  "pointer-events-none absolute left-1/2 top-3 z-10 m-0 -translate-x-1/2 rounded-full border border-gold/40 bg-bg/90 px-4 py-1.5 text-sm font-semibold italic text-text/85";

// An empty prompt bank is a fault, and the loudest place to say so is the
// middle of the board — which also costs no row. It never takes the pointer:
// the artist can still draw under it.
export const waitingNote =
  "pointer-events-none absolute left-1/2 top-1/2 z-10 m-0 w-[min(30rem,80%)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/25 bg-bg/90 px-4 py-3 text-center text-sm font-medium text-muted";

// No host view at all: the body stands in for the easel rather than leaving the
// canvas empty.
export const statusNote =
  "flex h-full min-h-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-center text-base font-medium text-muted";

// The foot row (§4, `actions`). A bare row, not the panel this toolbar used to
// sit in: the panel's border and padding were 18px of height, and 18px of
// height is 29px of board width on a surface that letterboxes against height.
// The row's own height is now exactly the 44px touch target (DESIGN.md §2.0A).
export const actions = "flex items-center gap-[clamp(0.35rem,0.9vw,0.7rem)]";

export const toolGroup = "flex items-center gap-2";

export const toolButton = takeoverSecondary;

export const verdictGroup = "ml-auto flex items-center gap-2";

// The house verdict (DESIGN.md §2.0B, "Takeover controls") at its 44px floor:
// on a surface that letterboxes against height, the row stays the touch target
// and not a pixel more. CORRECT is rendered first (§4, owner decision P7).
export {
  verdictButtonSuccess as verdictCorrect,
  verdictButtonDanger as verdictIncorrect,
  verdictIcon
};

// Inks are drawing content, not UI accents, so the swatches carry their own
// color rather than a surface token — via the `--ink-color` custom property
// each swatch's own class sets (index.tsx), never an inline style prop.
export const inkLight =
  "h-11 w-11 rounded-full border-2 border-shade/40 bg-[var(--ink-color)] shadow-[inset_0_-4px_8px_theme(colors.shade/45%),inset_0_4px_8px_theme(colors.text/18%),0_0_12px_var(--ink-color)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const inkLightSelected =
  "outline outline-[3px] outline-offset-2 outline-gold";
