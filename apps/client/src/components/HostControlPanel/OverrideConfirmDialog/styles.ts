import { actionButtonSecondary } from "@wingnight/surface";

// `danger` is the confirmation accent: this is the one dock surface that asks
// "are you sure", and every question it asks is an escape hatch that throws
// room state away. Not `gold` — that is the winner's colour (DESIGN.md §0.1).
// The title stays white; red text that small is under 4.5:1 on the dock.
export const card =
  "mx-1.5 mt-4 rounded-md border border-danger/50 bg-danger/[0.08] p-4";

export const title =
  "m-0 text-[0.95rem] font-black uppercase tracking-[0.14em] text-text";

export const description = "mt-1.5 text-[0.9rem] leading-[1.45] text-text/85";

export const actions = "mt-3 flex flex-wrap items-center gap-2";

export const confirmButton =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-danger/70 bg-danger/25 px-4 text-[0.85rem] font-extrabold uppercase tracking-[0.18em] text-text transition hover:bg-danger/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger";

export const cancelButton = actionButtonSecondary;
