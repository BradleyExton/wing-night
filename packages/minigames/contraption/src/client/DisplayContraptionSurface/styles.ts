export const container =
  "flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 px-8 text-center";

export const hint = "m-0 text-lg text-mutedWarm";

export const introTitle =
  "m-0 font-serif text-6xl font-bold italic leading-none text-text [text-shadow:0_0_28px_rgba(249,115,22,0.45)]";

export const introDescription = "m-0 max-w-3xl text-2xl leading-relaxed text-mutedWarm";

export const stage = "relative h-full min-h-0 w-full overflow-hidden bg-bg";

// Right padding keeps the chips clear of the display's absolute timer chip
// pinned to the stage's top-right corner.
export const chipRow =
  "pointer-events-none absolute left-[clamp(1rem,2vw,2rem)] top-[clamp(0.8rem,1.5vh,1.5rem)] flex flex-wrap items-center gap-3 pr-[clamp(8rem,14vw,18rem)]";

export const levelChip =
  "rounded-full border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-5 py-2 font-serif text-[clamp(1.1rem,1.8vw,2rem)] font-bold italic text-text shadow-[inset_0_0_24px_rgba(251,191,36,0.16)]";

export const metaChip =
  "rounded-full border border-text/15 bg-surface/80 px-4 py-2 font-mono text-[clamp(0.8rem,1.2vw,1.3rem)] font-extrabold uppercase tracking-[0.18em] text-gold";

export const buildingBanner =
  "pointer-events-none absolute bottom-[clamp(1rem,3vh,2.5rem)] left-1/2 -translate-x-1/2 text-center";

export const buildingPrompt =
  "m-0 font-serif text-[clamp(1.6rem,3vw,3.2rem)] font-bold italic leading-tight text-text/85 motion-safe:animate-pulse";

export const buildingHint = "m-0 text-[clamp(0.9rem,1.3vw,1.4rem)] text-mutedWarm";

export const verdictOverlay =
  "pointer-events-none absolute inset-0 grid place-items-center px-[8%]";

export const verdictPlaqueLanded =
  "flex items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-[#5fe093] bg-gradient-to-b from-[#2a4d1f] to-[#0e2a14] px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1rem,1.8vh,1.8rem)] shadow-[0_0_70px_rgba(47,184,108,0.4),0_14px_32px_rgba(0,0,0,0.6)]";

export const verdictPlaqueMissed =
  "flex items-center gap-[clamp(1.2rem,2.4vw,2.4rem)] rounded-2xl border-[3px] border-[#ff8a8a] bg-gradient-to-b from-[#4d1f1f] to-[#2a0e0e] px-[clamp(1.8rem,3vw,3rem)] py-[clamp(1rem,1.8vh,1.8rem)] shadow-[0_0_70px_rgba(240,64,64,0.35),0_14px_32px_rgba(0,0,0,0.6)]";

export const verdictLabel =
  "m-0 font-serif text-[clamp(2rem,3.6vw,3.8rem)] font-bold italic leading-none text-text";

export const verdictPoints =
  "m-0 font-mono text-[clamp(2.6rem,4.4vw,4.6rem)] font-black leading-none text-gold [text-shadow:0_0_18px_rgba(251,191,36,0.5)]";

export const verdictMeta =
  "m-0 text-[clamp(0.8rem,1.1vw,1.1rem)] font-bold uppercase tracking-[0.28em] text-mutedWarm";

export const doneTitle = "m-0 font-serif text-5xl font-bold italic leading-tight text-text";
