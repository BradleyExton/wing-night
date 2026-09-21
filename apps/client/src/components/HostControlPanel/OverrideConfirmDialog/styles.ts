import { actionButtonSecondary } from "@wingnight/surface";

// Gold is the confirmation accent: this is the one dock surface that asks
// "are you sure", and it should read as a distinct beat, not another group.
export const card =
  "mx-1.5 mt-4 rounded-md border border-gold/40 bg-gold/[0.08] p-4";

export const title =
  "m-0 text-[0.95rem] font-black uppercase tracking-[0.14em] text-gold";

export const description = "mt-1.5 text-[0.9rem] leading-[1.45] text-text/85";

export const actions = "mt-3 flex flex-wrap items-center gap-2";

export const confirmButton =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-gold/60 bg-gold/20 px-4 text-[0.85rem] font-extrabold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export const cancelButton = actionButtonSecondary;
