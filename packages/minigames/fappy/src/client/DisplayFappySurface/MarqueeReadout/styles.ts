// The relay's own readouts in the TV marquee's `readout` slot
// (`<NeonMarquee>` from @wingnight/surface, DESIGN.md §2.2D). The marquee is
// the shared container; these are what FAPPY puts in it.

export const marqueeLeg =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-muted";

export const marqueeGates =
  "font-mono text-[clamp(0.9rem,1.4vw,1.5rem)] font-extrabold text-text";

// The relay clock is the room's scoreboard while the bird is in the air.
export const marqueeClock =
  "font-mono text-[clamp(1.3rem,2.2vw,2.4rem)] font-extrabold text-text [font-variant-numeric:tabular-nums]";

// What a finish right now would pay, big enough to be the second thing read
// after the clock — the clock is only pressure once the room can see what it
// is spending. Gold while par is intact, heat once every tenth is costing a
// point.
export const marqueePointsCell = "flex flex-col items-end leading-none";

export const marqueePoints =
  "font-mono text-[clamp(1.5rem,2.6vw,2.8rem)] font-black text-gold [font-variant-numeric:tabular-nums]";

export const marqueePointsDraining = "text-heat";

export const marqueeParHint =
  "mt-0.5 text-[clamp(0.6rem,0.85vw,0.85rem)] font-extrabold uppercase tracking-[0.2em] text-mutedWarmDim";

// The target: the slowest finish that still tops the best rival this round.
export const marqueeBeat =
  "max-w-[14ch] text-right text-[clamp(0.62rem,0.95vw,1rem)] font-extrabold uppercase leading-tight tracking-[0.14em] text-primary";

export const marqueeClockPastPar = "text-gold";

export const marqueeClockUrgent = "text-heat";

