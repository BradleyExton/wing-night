import { stageStatusLine } from "@wingnight/surface";

// TV surface per DESIGN.md §2.6 ("Clue Board"): the shared marquee (§2.2D)
// over a fixed board of clue slots, letterboxed into whatever height the
// marquee and the status line leave. The ember stage is DRAWING's showtime material (§2.5),
// shared so the two minigames read as the same show.
export const container =
  "flex h-full min-h-0 flex-col gap-[clamp(0.7rem,1.2vh,1.2rem)] bg-[radial-gradient(ellipse_at_top,#2a1306_0%,#0f0a08_60%,#050505_100%)] p-[clamp(0.8rem,1.4vw,1.6rem)]";

export const boardArea =
  "relative grid min-h-0 flex-1 justify-items-center gap-[clamp(0.4rem,1vh,0.9rem)] px-[clamp(1rem,3vw,3rem)] [grid-template-rows:1fr_auto]";

export const statusLine = stageStatusLine;

export const statusCount = "font-score tabular-nums text-primary";

// Turn-complete card: the last thing on screen before the host advances, so
// it carries the turn's haul rather than a bare headline.
export const turnCompleteCard =
  "self-center rounded-2xl border-2 border-text/20 bg-gradient-to-b from-surface to-bg px-[clamp(2rem,4vw,4rem)] py-[clamp(1.2rem,2.4vh,2.4rem)] text-center shadow-[0_14px_32px_theme(colors.shade/60%)]";

export const turnCompleteTitle =
  "text-center text-[clamp(1.5rem,3vw,3rem)] font-black uppercase tracking-[0.08em] text-text";

export const turnCompleteHint = `${statusLine} mt-2`;
