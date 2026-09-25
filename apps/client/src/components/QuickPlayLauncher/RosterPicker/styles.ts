export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckGroupCount as groupCount,
  actionButtonSecondary as actionButton,
  teamDot
} from "@wingnight/surface";

export const actions = "mb-3 flex gap-2 px-1.5";

export const empty = "px-1.5 text-sm text-muted";

export const grid = "grid grid-cols-2 gap-2 sm:grid-cols-3";

// Big enough for a sauce-covered thumb (DESIGN.md §2.1), and the whole chip
// is the target — the dot is decoration.
export const chip =
  "inline-flex min-h-[56px] items-center gap-2.5 rounded-md border border-text/10 bg-text/[0.03] px-3.5 text-left text-[clamp(0.95rem,1.1vw,1.05rem)] font-bold text-muted transition hover:border-text/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const chipActive = "border-primary/55 bg-primary/15 text-text hover:border-primary/70";

export const chipName = "min-w-0 truncate";
