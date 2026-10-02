import { takeoverLabelAccent } from "@wingnight/surface";

// The handoff pick floats over the middle of the street while the block is on the line, between
// the two thumb-rest glyphs, which stay where they are: the pick says "or just start walking",
// and the glyphs say where. The layer itself lets every touch through to the thumb zones; only
// the two cards take one. Nothing reaches the bottom-right corner dock.
export const overlay =
  "pointer-events-none absolute inset-x-0 top-0 bottom-[5.5rem] z-20 flex flex-col items-center justify-center gap-3 motion-safe:animate-[scene-callout_420ms_cubic-bezier(0.2,1.4,0.4,1)_both]";

export const label = `${takeoverLabelAccent} pl-[6%] [text-shadow:0_1px_8px_theme(colors.shade/90%)]`;

// Narrow enough to sit between the walk thumb's glyph and the peck ring at a tablet's width, so
// neither card covers the teaching it says to use ("or just start walking"). The walk glyph is the
// wider of the two, so the pair sits a little right of the arena's middle.
export const cards = "flex items-stretch gap-3 pl-[6%]";

const card =
  "pointer-events-auto flex w-[clamp(11.5rem,19vw,15rem)] flex-col items-start gap-1.5 rounded-2xl border-2 bg-bg/85 px-4 py-3.5 text-left backdrop-blur transition active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

// The spend: the team's banked worth for a heart, so it wears the hearts' own heat.
export const buyCard = `${card} border-heat/80 shadow-[0_0_24px_theme(colors.heat/30%)] hover:border-heat`;

// The save: doing nothing is a choice too, so it is a card, quieter, never a dismiss link.
export const keepCard = `${card} border-text/20 hover:border-text/40`;

export const glyph = "font-score text-[1.6rem] leading-none tracking-[0.08em] text-heat";

export const keepGlyph = "font-score text-[1.6rem] leading-none tracking-[0.08em] text-heat/60";

export const title = "text-[1.05rem] font-black uppercase tracking-[0.12em] text-text";

export const detail = "text-[0.82rem] font-semibold leading-snug text-text/75";

// "· you have 14" never breaks in half: the bank wraps as one piece under the price.
export const detailBank = "whitespace-nowrap";
