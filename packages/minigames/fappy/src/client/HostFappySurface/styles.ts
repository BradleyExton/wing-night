export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot = "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const arenaColumn = "flex min-h-0 min-w-0 flex-1 flex-col gap-2";

export const arenaHint = "m-0 px-1 text-center text-sm italic text-muted";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const legCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const legCounter = "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const flyingName = "m-0 mt-1 font-serif text-xl font-bold italic leading-tight text-text";

export const legMeta = "mt-1 flex items-center justify-between text-xs text-mutedWarm";

export const finishCard =
  "rounded-xl border border-[#3a200d] bg-gradient-to-b from-[#1a0e05] to-[#0a0604] px-4 py-3 text-center";

export const finishTitle =
  "m-0 text-2xl font-black uppercase tracking-[0.08em] text-gold [text-shadow:0_0_14px_rgba(251,191,36,0.35)]";

export const finishTitleTimedOut = "text-heat";

export const finishTime = "mt-1 block font-mono text-lg text-text";

export const finishPoints = "mt-1 block font-mono text-3xl font-black text-gold";

export const deckRows = "flex gap-2";

export const deckRowButton =
  "min-h-12 flex-1 rounded-lg border border-[#3a200d] bg-surface text-xs font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";
