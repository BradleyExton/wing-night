export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot = "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

// The wing tally is the one number the tablet holder should feel: it is the score and the health
// bar at once.
export const railWings = "ml-auto flex items-baseline gap-2 font-mono text-base tracking-normal text-gold";

export const railWingsLabel = "text-xs text-mutedWarmDim";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const arenaColumn = "flex min-h-0 min-w-0 flex-1 flex-col gap-2";

export const arenaHint = "m-0 px-1 text-center text-sm italic text-muted";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const runCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const runCounter = "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const runningName = "m-0 mt-1 text-lg font-black text-text";

export const runMeta = "mt-1 flex flex-wrap items-center gap-2 text-xs text-mutedWarmDim";

export const finishCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 text-center";

export const finishTitle = "m-0 text-base font-black uppercase tracking-[0.2em] text-gold";

export const finishPoints = "font-mono text-2xl font-extrabold text-text";

export const deckRows = "flex flex-col gap-2";

export const deckRowButton =
  "w-full rounded-lg border-2 border-mutedWarmDim/60 bg-surface px-3 py-2 text-sm font-bold uppercase tracking-[0.14em] text-text disabled:opacity-45";
