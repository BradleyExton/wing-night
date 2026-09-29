import { stageStatusLine } from "@wingnight/surface";

// TV surface per DESIGN.md §2.6 ("Stage"): the shared marquee (§2.2D) over
// the clue stage — the last six emoji, big, with no board behind them — sized
// into whatever height the marquee and the status line leave.
export const container =
  "flex h-full min-h-0 flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)]";

export const boardArea =
  "relative grid min-h-0 flex-1 justify-items-center gap-[clamp(0.4rem,1vh,0.9rem)] px-[clamp(1rem,3vw,3rem)] [grid-template-rows:1fr_auto]";

export const statusLine = stageStatusLine;

export const statusCount = "font-score tabular-nums text-primary";

// Turn-complete card: the last thing on screen before the host advances, so
// it carries the turn's haul rather than a bare headline.
export const turnCompleteCard =
  "self-center motion-safe:[animation:heroReveal_520ms_cubic-bezier(0.2,1.2,0.4,1)_both] rounded-2xl border-2 border-text/20 bg-gradient-to-b from-surface to-bg px-[clamp(2rem,4vw,4rem)] py-[clamp(1.2rem,2.4vh,2.4rem)] text-center shadow-[0_14px_32px_theme(colors.shade/60%)]";

export const turnCompleteTitle =
  "text-center text-[clamp(1.5rem,3vw,3rem)] font-black uppercase tracking-[0.08em] text-text";

export const turnCompleteHint = `${statusLine} mt-2`;
