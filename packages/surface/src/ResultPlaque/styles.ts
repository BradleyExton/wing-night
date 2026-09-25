// The TV's one result card (DESIGN.md §2.2E). Opaque, because a held sketch or a
// scene can sit behind it and a translucent panel lets strokes cut through the
// words. One entrance for every game: `plaque-enter` (keyframes.css), a short
// rise that settles, and nothing at all under reduced motion.
const plaqueBase =
  "flex max-w-full items-center gap-[clamp(1.2rem,2.4vw,2.6rem)] rounded-2xl border-[3px] bg-gradient-to-b from-surface to-bg px-[clamp(1.6rem,3vw,3rem)] py-[clamp(1rem,1.8vh,1.8rem)] text-left motion-safe:[animation:plaque-enter_320ms_cubic-bezier(0.2,1.2,0.4,1)_both]";

export const plaqueHit = `${plaqueBase} border-success/70 shadow-[0_0_60px_theme(colors.success/30%),0_14px_32px_theme(colors.shade/60%)]`;

export const plaqueMiss = `${plaqueBase} border-danger/60 shadow-[0_0_60px_theme(colors.danger/25%),0_14px_32px_theme(colors.shade/60%)]`;

export const plaqueNeutral = `${plaqueBase} border-text/20 shadow-[0_14px_32px_theme(colors.shade/60%)]`;

const glyphBase = "shrink-0 text-[clamp(2.4rem,4vw,4.2rem)] font-black leading-none";

export const glyphHit = `${glyphBase} text-success`;

export const glyphMiss = `${glyphBase} text-danger`;

export const body = "flex min-w-0 flex-1 flex-col";

const kickerBase =
  "m-0 mb-[0.4em] text-[clamp(0.85rem,1.1vw,1.3rem)] font-extrabold uppercase tracking-[0.26em]";

export const kickerHit = `${kickerBase} text-success`;

export const kickerMiss = `${kickerBase} text-danger`;

export const kickerNeutral = `${kickerBase} text-mutedWarm`;

export const title =
  "m-0 text-balance text-[clamp(2rem,3.6vw,3.8rem)] font-black uppercase leading-[1.02] tracking-[0.04em] text-text";

export const detail = "m-0 mt-[0.4em] text-[clamp(1rem,1.5vw,1.6rem)] leading-snug text-mutedWarm";

export const award = "flex shrink-0 flex-col items-end text-right";

export const pointsCaption =
  "mt-[0.4em] text-[clamp(0.8rem,1vw,1.1rem)] font-bold uppercase tracking-[0.24em] text-muted";

// Whatever follows the result on the same card — SCHLONIC's "who takes it next" —
// under a hairline, so the room reads one card rather than two stacked.
export const footer = "mt-[clamp(0.8rem,1.4vh,1.4rem)] border-t border-text/15 pt-[clamp(0.8rem,1.4vh,1.4rem)]";
