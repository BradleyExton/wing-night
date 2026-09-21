export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot = "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

export const railPending = "ml-auto font-mono text-sm tracking-normal text-gold";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const arenaColumn = "flex min-h-0 min-w-0 flex-1 flex-col gap-2";

export const arenaFrame =
  "relative min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-[#3a200d] bg-[linear-gradient(180deg,#160c2a_0%,#4a1f3f_54%,#c2582c_86.6%,#d6ac63_86.7%,#b58a45_100%)] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]";

export const arenaHint = "m-0 px-1 text-center text-sm italic text-muted";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const shotCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const shotCounter = "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const arenaName = "m-0 mt-1 font-serif text-xl font-bold italic leading-tight text-text";

export const resultCard =
  "rounded-xl border border-[#3a200d] bg-gradient-to-b from-[#1a0e05] to-[#0a0604] px-4 py-3 text-center";

export const resultTitle =
  "m-0 text-2xl font-black uppercase tracking-[0.08em] text-text [text-shadow:0_0_14px_rgba(251,191,36,0.35)]";

export const resultTitleHit = "text-gold";

export const resultBlurb = "m-0 mt-1 text-sm italic text-mutedWarm";

export const resultPoints = "mt-2 block font-mono text-3xl font-black text-gold";

export const waitingNote =
  "rounded-xl border border-text/10 bg-surface px-4 py-3 text-sm text-text/85";

export const primaryButton =
  "min-h-[64px] w-full rounded-xl border-2 border-gold bg-[radial-gradient(ellipse_at_top,#f9a51a_0%,#8a4b06_100%)] text-lg font-extrabold uppercase tracking-[0.12em] text-[#1c0d02] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const deckRows = "flex gap-2";

export const deckRowButton =
  "min-h-12 flex-1 rounded-lg border border-[#3a200d] bg-surface text-xs font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const doneNote =
  "rounded-xl border border-gold/40 bg-surface px-4 py-3 text-center text-sm text-gold";
