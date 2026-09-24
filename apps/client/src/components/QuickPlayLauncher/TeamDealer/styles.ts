export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckGroupCount as groupCount,
  deckChip as chip,
  deckChipActive as chipActive,
  actionButtonSecondary as actionButton,
  fieldLabel as controlLabel,
  teamDot
} from "@wingnight/surface";

export const controls = "mb-3 flex flex-wrap items-center gap-3 px-1.5";

export const chipRow = "inline-flex gap-1.5";

export const columns = "grid gap-3 sm:grid-cols-2";

export const column =
  "flex min-h-[7rem] flex-col gap-1.5 rounded-md border border-text/10 bg-text/[0.02] p-3";

export const teamName =
  "mb-1 inline-flex items-center gap-2 text-[clamp(0.72rem,0.85vw,0.85rem)] font-extrabold uppercase tracking-[0.2em] text-text";

export const emptyTeam = "text-sm text-muted";

export const member =
  "inline-flex min-h-[44px] items-center rounded-md border border-text/10 bg-text/[0.04] px-3 text-left text-[clamp(0.95rem,1.1vw,1.05rem)] font-bold text-text transition hover:bg-text/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const hint = "mt-3 px-1.5 text-sm text-muted";
