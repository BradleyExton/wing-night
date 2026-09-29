export const scrim =
  "fixed inset-0 z-30 flex items-center justify-center bg-shade/70 px-4 backdrop-blur-[2px] [animation:reveal_400ms_cubic-bezier(0.2,0.7,0.2,1)_both]";

export const card =
  "flex w-full max-w-[26rem] flex-col items-center gap-1 rounded-2xl border border-primary/25 bg-[linear-gradient(180deg,theme(colors.hearthGlass/92%)_0%,theme(colors.shade/96%)_100%)] px-5 py-4 text-center [box-shadow:inset_0_1px_0_theme(colors.glow/14%),0_24px_60px_-20px_theme(colors.shade/90%)]";

export const kicker = "m-0 text-xs font-extrabold uppercase tracking-[0.36em] text-primary";

// Wings are the score and the health bar, and gold everywhere they are counted (DESIGN.md §2.11).
export const wings =
  "m-0 font-score text-[clamp(2.4rem,7vw,3.4rem)] font-bold leading-none tabular-nums text-gold";

export const newBest = "m-0 font-voice text-base italic text-text";

export const best = "m-0 text-sm font-semibold text-mutedWarm";

export const actions = "mt-3 flex w-full flex-wrap justify-center gap-2";

const buttonBase =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 text-sm font-extrabold uppercase tracking-[0.12em] no-underline active:translate-y-px";

// The house button: flat primary with a darker edge along the bottom.
export const primaryButton = `${buttonBase} bg-primary text-bg [box-shadow:inset_0_-3px_0_theme(colors.shade/35%)]`;

export const secondaryButton = `${buttonBase} border border-text/15 bg-text/[0.06] text-text`;
