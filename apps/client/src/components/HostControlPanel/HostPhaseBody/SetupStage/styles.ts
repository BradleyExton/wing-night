export {
  stageEyebrow as eyebrow,
  stageHeadline as headline,
  stageHeadlineAccent as headlineAccent,
  stageMeta as meta,
  stageMetaStrong as metaStrong,
  deckAddButton as actionButton
} from "@wingnight/surface";

export const heroActionRow =
  "mt-[clamp(0.75rem,1.5vh,1.25rem)] flex flex-wrap items-center gap-2";

// Sits beside the auto-assign button at the same height, but quieter: it
// leaves the page, so it wears the deck's secondary control shape.
export const quickPlayLink =
  "inline-flex min-h-[52px] items-center rounded-md border border-text/10 bg-text/[0.04] px-4 text-[clamp(0.85rem,1vw,0.95rem)] font-extrabold uppercase tracking-[0.18em] text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
