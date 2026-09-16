export const container = "flex h-full min-h-0 flex-col gap-3";

// Mini-rail strip, echoing the host shell anatomy (DESIGN.md §2.0A).
export const rail =
  "flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pr-[clamp(9rem,15vw,12rem)] text-xs font-extrabold uppercase tracking-[0.22em] text-muted";

export const railTitle = "text-primary";

export const railTeam = "flex items-center gap-2 text-text";

export const railTeamDot =
  "h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_#f97316]";

export const railPending = "ml-auto font-mono text-sm tracking-normal text-gold";

export const introCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 text-base text-text/90 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const playArea = "flex min-h-0 flex-1 gap-3";

export const stageColumn = "flex min-h-0 min-w-0 flex-1 flex-col gap-3";

export const deck = "flex w-[clamp(230px,28vw,330px)] flex-col gap-3";

export const songCard =
  "rounded-xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-4 shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const songCounter =
  "text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-gold";

export const answerLabel =
  "mt-3 block text-[0.62rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const answerTitle =
  "m-0 font-serif text-3xl font-bold italic leading-tight text-text";

export const answerArtist = "m-0 mt-1 text-lg text-mutedWarm";

export const answerArtistPrefix = "pr-1 italic";

export const badgeRow = "mt-3 flex flex-wrap items-center gap-2";

export const difficultyBadge =
  "rounded-full border border-gold/60 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.2em] text-gold";

export const hintText = "m-0 text-sm italic text-mutedWarm";

export const waitingNote =
  "rounded-xl border border-text/10 bg-surface px-4 py-3 text-sm text-text/85";

export const transportRow = "flex flex-wrap gap-2";

export const transportPrimary =
  "flex min-h-[64px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#5fe093] bg-[radial-gradient(ellipse_at_top,#2fb86c_0%,#0e6a36_100%)] text-lg font-extrabold uppercase tracking-[0.1em] text-[#061a0c] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const transportSecondary =
  "min-h-[64px] flex-1 rounded-xl border border-[#3a200d] bg-surface px-3 text-sm font-extrabold uppercase tracking-[0.14em] text-text transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40";

export const revealButton =
  "min-h-[64px] w-full rounded-xl border-2 border-gold bg-[radial-gradient(ellipse_at_top,#f9a51a_0%,#8a4b06_100%)] text-lg font-extrabold uppercase tracking-[0.12em] text-[#1c0d02] shadow-[0_4px_0_rgba(0,0,0,0.45)] transition disabled:cursor-not-allowed disabled:opacity-40";

export const doneNote =
  "rounded-xl border border-gold/40 bg-surface px-4 py-3 text-center text-sm text-gold";

export const totalsCard =
  "rounded-xl border border-[#3a200d] bg-gradient-to-b from-[#1a0e05] to-[#0a0604] p-3";

export const totalsTitle =
  "mb-2 block text-[0.6rem] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const totalsRow =
  "flex items-center justify-between border-b border-text/5 py-1.5 text-sm text-text last:border-b-0";

export const totalsRowActive = "text-gold";

export const totalsPoints = "font-mono text-sm text-gold";
