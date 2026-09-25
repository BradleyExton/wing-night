export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckGroupCount as groupCount
} from "@wingnight/surface";

export const hint = "mb-3 px-1.5 text-sm text-muted";

// `minmax(0,1fr)` and the `min-w-0`s below: a <button> reports its content's
// max-content as its minimum, so without them a long summary widens the card
// past the column instead of wrapping.
export const list = "grid grid-cols-[minmax(0,1fr)] gap-3";

export const card =
  "relative min-w-0 rounded-xl border border-text/10 bg-surface/70 p-3 transition";

export const cardQueued = "border-primary/55 bg-primary/10";

// The whole card face is the toggle; the reorder buttons and the settings
// sit below it so a thumb never lands on two controls at once.
export const cardToggle =
  "flex w-full min-w-0 items-center gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const position =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-text/15 font-mono text-sm font-extrabold text-muted";

export const positionQueued = "border-primary bg-primary text-bg";

export const thumb = "h-14 w-14 shrink-0 rounded-lg bg-bg/60 object-contain p-1 ring-1 ring-text/10";

export const cardBody = "flex min-w-0 flex-col";

export const cardName = "text-lg font-bold leading-tight text-text";

export const cardDetail = "mt-0.5 block text-sm leading-relaxed text-text/80";

export const cardControls = "absolute right-3 top-3 inline-flex gap-1.5";

export const moveButton =
  "inline-flex h-11 w-11 items-center justify-center rounded-md border border-text/10 bg-text/[0.04] text-lg font-bold text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";
