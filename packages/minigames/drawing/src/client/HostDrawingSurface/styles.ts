export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot =
  "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

export const railPending = "ml-auto font-mono text-sm tracking-normal text-gold";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const easelColumn = "min-h-0 min-w-0 flex-1";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const promptCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-4 py-3 text-center shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const promptCardLabel =
  "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const promptCardText =
  "m-0 font-serif text-2xl font-bold italic leading-tight text-text [text-shadow:0_0_12px_rgba(251,191,36,0.35)]";

export const waitingNote =
  "rounded-xl border border-text/10 bg-surface px-4 py-3 text-sm text-text/85";

export const revealLine = "m-0 px-1 text-center text-sm italic text-muted";

export const verdictCorrect =
  "flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#5fe093] bg-[radial-gradient(ellipse_at_top,#2fb86c_0%,#0e6a36_100%)] font-extrabold uppercase tracking-[0.1em] text-[#061a0c] shadow-[0_4px_0_rgba(0,0,0,0.45),0_6px_14px_rgba(0,0,0,0.35)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const verdictIncorrect =
  "flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#ff8a8a] bg-[radial-gradient(ellipse_at_top,#f04040_0%,#800f0f_100%)] font-extrabold uppercase tracking-[0.1em] text-[#1c0303] shadow-[0_4px_0_rgba(0,0,0,0.45),0_6px_14px_rgba(0,0,0,0.35)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const verdictIcon = "text-3xl leading-none";

export const verdictLabel = "text-lg";

export const verdictSub = "text-[0.62rem] tracking-[0.24em] opacity-80";

export const deckRows = "flex gap-2";

export const deckRowButton =
  "min-h-12 flex-1 rounded-lg border border-[#3a200d] bg-surface text-xs font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const paletteGrid =
  "grid grid-cols-6 gap-2 rounded-xl border border-[#3a200d] bg-gradient-to-b from-[#1a0e05] to-[#0a0604] p-3";

export const inkLight =
  "aspect-square w-full rounded-full border-2 border-black/50 transition disabled:cursor-not-allowed disabled:opacity-40";

export const inkLightSelected = "outline outline-[3px] outline-offset-[3px] outline-gold";
