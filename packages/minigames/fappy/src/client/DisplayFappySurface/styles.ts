export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// Marquee row (DESIGN.md §2.9): team left, show title centre, leg + gates + clock right.
export const marquee =
  "relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.4rem,2.4vw,2.4rem)] py-[clamp(0.7rem,1.2vh,1.2rem)] shadow-[inset_0_0_36px_rgba(251,191,36,0.2),0_8px_20px_rgba(0,0,0,0.55)]";

export const marqueeTeamName =
  "m-0 text-[clamp(1.2rem,2vw,2.1rem)] font-black uppercase tracking-[0.06em] text-text";

export const marqueeTitle =
  "text-center text-[clamp(0.8rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.34em] text-gold";

// Right padding keeps the readout clear of the display's absolute timer chip
// pinned to the stage's top-right corner.
export const marqueeMeta =
  "flex items-center justify-end gap-[clamp(0.8rem,1.4vw,1.4rem)] pr-[clamp(8rem,14vw,18rem)] text-right";

export const marqueeLeg =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-muted";

export const marqueeGates =
  "font-mono text-[clamp(0.9rem,1.4vw,1.5rem)] font-extrabold text-text";

// The relay clock is the room's scoreboard while the bird is in the air.
export const marqueeClock =
  "font-mono text-[clamp(1.3rem,2.2vw,2.4rem)] font-extrabold text-text [font-variant-numeric:tabular-nums]";

export const marqueeClockPastPar = "text-gold";

export const marqueeClockUrgent = "text-heat";

export const arenaArea =
  "relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-[#3a200d] bg-[#160c2a] shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]";

export const resultOverlay =
  "pointer-events-none absolute inset-x-0 top-[6%] z-20 flex justify-center px-[8%]";

export const resultPlaque =
  "flex items-center gap-[clamp(1rem,2vw,2rem)] rounded-2xl border-[3px] border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.6rem,2.8vw,2.8rem)] py-[clamp(0.8rem,1.4vh,1.4rem)] shadow-[0_0_70px_rgba(251,191,36,0.35),0_14px_32px_rgba(0,0,0,0.6)]";

export const resultPlaqueTimedOut = "border-heat/60 shadow-[0_14px_32px_rgba(0,0,0,0.6)]";

export const resultTitle =
  "m-0 text-[clamp(2rem,3.6vw,3.8rem)] font-black uppercase leading-none tracking-[0.06em] text-gold [text-shadow:0_0_24px_rgba(251,191,36,0.5)]";

export const resultTitleTimedOut = "text-heat [text-shadow:none]";

export const resultBlurb =
  "m-0 mt-1 font-serif text-[clamp(0.9rem,1.5vw,1.6rem)] italic text-mutedWarm";

export const resultPoints =
  "font-mono text-[clamp(2.4rem,4vw,4.2rem)] font-black leading-none text-gold [text-shadow:0_0_18px_rgba(251,191,36,0.5)]";

// The handoff call, over the corridor between legs, the size of the plaque:
// the clock is running while the next player reads it.
export const handoffPlaque =
  "rounded-2xl border-[3px] border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.6rem,2.8vw,2.8rem)] py-[clamp(0.8rem,1.4vh,1.4rem)] text-[clamp(1.6rem,3vw,3.2rem)] font-black uppercase tracking-[0.08em] text-gold shadow-[0_0_70px_rgba(251,191,36,0.35)]";

export const statusLine =
  "m-0 text-center text-[clamp(0.85rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.26em] text-primary";

export const container =
  "flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

export const hint = "m-0 text-lg text-mutedWarm";

export const introTitle =
  "m-0 font-serif text-6xl font-bold italic leading-none text-text [text-shadow:0_0_28px_rgba(249,115,22,0.45)]";

export const introDescription = "m-0 max-w-3xl text-2xl leading-relaxed text-mutedWarm";
