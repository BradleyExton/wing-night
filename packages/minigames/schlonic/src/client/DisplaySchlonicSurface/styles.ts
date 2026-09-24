export const container = "flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-10 text-center";

export const introTitle =
  "m-0 font-serif text-[clamp(2.4rem,6vw,5rem)] font-bold italic leading-none text-gold";

export const introDescription =
  "m-0 max-w-[46ch] text-[clamp(1rem,1.6vw,1.6rem)] leading-relaxed text-text/90";

export const hint = "m-0 text-[clamp(1rem,1.6vw,1.6rem)] italic text-muted";

export const stage =
  "flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)] bg-bg p-[clamp(0.8rem,1.4vw,1.6rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D).

export const marqueeRun =
  "text-[clamp(0.72rem,1vw,1.05rem)] font-extrabold uppercase tracking-[0.28em] text-muted";

// The wings in hand: the room's health bar while the runner is on the hill, written by the
// mirror's paint loop rather than by the view.
export const marqueeInHand =
  "font-mono text-[clamp(1.5rem,2.6vw,2.8rem)] font-extrabold leading-none text-gold [font-variant-numeric:tabular-nums]";

// What the team has already put on the board, against par.
export const marqueeWings =
  "font-mono text-[clamp(1rem,1.5vw,1.6rem)] font-extrabold text-gold/80 [font-variant-numeric:tabular-nums]";

export const marqueeWingsLabel =
  "text-[clamp(0.6rem,0.9vw,0.95rem)] font-extrabold uppercase tracking-[0.28em] text-mutedWarmDim";

export const arenaArea =
  "relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-[#1f6b34] bg-[#0d1f14] shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]";

export const runEnter = "h-full w-full motion-safe:animate-[schlonic-scene-enter_420ms_ease-out_both]";

export const resultOverlay =
  "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(12,26,16,0.78)_0%,rgba(12,26,16,0.1)_72%)]";

// One plaque per beat. The run's ending on top, and under it — on a handoff — who is next, so
// the room reads one card rather than two stacked over each other and a third line under the
// zone saying the same thing.
export const holdPlaque =
  "flex flex-col items-center gap-[clamp(0.6rem,1.2vh,1.2rem)] rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.8rem,3.4vw,3.6rem)] py-[clamp(1rem,1.8vh,1.8rem)] text-center motion-safe:animate-[schlonic-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const holdNext =
  "flex flex-col items-center gap-1 border-t border-gold/30 pt-[clamp(0.6rem,1.2vh,1.2rem)]";

export const handoffName =
  "font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-bold italic leading-none text-text";

export const handoffLine =
  "text-[clamp(0.7rem,1vw,1.1rem)] font-extrabold uppercase tracking-[0.3em] text-gold";

export const resultPlaque =
  "flex items-center gap-[clamp(1.2rem,2.4vw,2.6rem)] rounded-2xl border-2 border-gold bg-gradient-to-b from-[#3a1d09] to-[#1a0c04] px-[clamp(1.8rem,3.4vw,3.6rem)] py-[clamp(1rem,1.8vh,1.8rem)]";

export const resultTitle =
  "m-0 font-serif text-[clamp(1.8rem,3.6vw,3.2rem)] font-bold italic leading-none text-gold";

export const resultTitleBad = "text-heat";

export const resultBlurb = "m-0 text-[clamp(0.9rem,1.3vw,1.3rem)] text-text/85";

export const resultPoints =
  "font-mono text-[clamp(2rem,4vw,3.6rem)] font-extrabold leading-none text-text";

export const statusLine =
  "m-0 text-center text-[clamp(1rem,1.7vw,1.8rem)] font-bold text-text/90";
