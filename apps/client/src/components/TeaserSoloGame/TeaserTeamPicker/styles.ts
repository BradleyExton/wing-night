// Laid out at the phone's own size, outside the scaled game canvas: a landscape phone is short,
// so the intro sits beside the teams rather than over them, and the page scrolls if it must.
export const container =
  "fixed inset-0 z-30 flex items-center gap-6 overflow-y-auto bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,theme(colors.primary/22%)_0%,transparent_65%)] bg-bg px-[max(1rem,env(safe-area-inset-left))] py-4";

export const intro = "flex w-[36%] shrink-0 flex-col gap-2 text-left";

export const kicker = "m-0 text-xs font-extrabold uppercase tracking-[0.36em] text-primary";

export const title = "m-0 text-[clamp(1.6rem,4.2vw,2.6rem)] font-black uppercase leading-[0.95] text-text";

export const body = "m-0 text-[clamp(0.78rem,1.7vw,0.95rem)] leading-snug text-mutedWarm";

export const teams = "grid flex-1 grid-cols-2 gap-3";

// The lobby's lit card, as the button that starts the relay.
export const team =
  "relative flex min-h-[8.5rem] flex-col items-center justify-end gap-1 overflow-hidden rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/84%)_0%,theme(colors.shade/93%)_100%)] px-2 pb-2 pt-3 [box-shadow:inset_0_1px_0_theme(colors.glow/14%)] active:scale-[0.98]";

export const riders = "flex h-[3.9rem] max-w-full items-end justify-center -space-x-5";

export const rider = "block h-full";

// TeamWordmark is inline by design; the box is the caller's to give.
export const teamName = "block max-w-full truncate text-[clamp(1rem,2.4vw,1.5rem)] leading-none";

export const teamNamePlain = "text-base font-black uppercase text-text";
