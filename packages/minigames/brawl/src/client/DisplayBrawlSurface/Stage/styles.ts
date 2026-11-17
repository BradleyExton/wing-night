import { readoutFigure, stageStatusLine } from "@wingnight/surface";

export const stage = "relative flex h-full w-full flex-col gap-[clamp(0.6rem,1.1vh,1.1rem)]";

// The marquee is `<NeonMarquee>` from @wingnight/surface (DESIGN.md §2.2D). Its readout carries
// the crew strip, then the turn's counts stacked beside it: the block, and the worth banked over
// what the street holds, in gold.
export const counts = "flex flex-col items-end gap-[0.35em] whitespace-nowrap";

export const tally = `${readoutFigure} flex items-baseline gap-[0.4em] text-gold`;

export const tallyLabel = "font-sans text-[0.36em] font-extrabold uppercase tracking-[0.2em] text-muted";

// The turn to beat, dimmer than the team's own gold because it is the target, not the score.
export const best = "text-text/60";

// No frame and no bars: the wall's camera fills the arena edge to edge (§2.11, Dunlop Dash's
// rule), so the street runs the whole width of the TV and the only edge is the arena's own
// rounded corner.
export const arenaArea = "relative flex min-h-0 flex-1 overflow-hidden rounded-2xl bg-bg";

// Each block's street slides in as the last one's ending lets go; the remount keys it
// (`scene-enter`). Filled backwards only: an animation that holds its last frame keeps its
// opacity in effect for as long as the street is up, for no picture at all.
export const blockEnter = "h-full w-full motion-safe:animate-[scene-enter_420ms_ease-out_backwards]";

export const hint = "m-auto text-[clamp(1rem,1.6vw,1.6rem)] italic text-muted";

// The turn's result, centred over the street once the last block's ending has played.
export const resultOverlay =
  "pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,theme(colors.bg/80%)_0%,transparent_78%)] px-[4%] motion-safe:animate-[scene-callout_520ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const statusLine = stageStatusLine;
