// The left thumb: the left half of the arena, a floating one-axis stick (docs/research/
// tablet-brawler-controls.md, scheme B). A faint wash marks it off from the peck zone without
// drawing a box over the street. Its glyph sits at the peck ring's height — the pad keeps the
// peck zone's dock clearance as bottom padding — which is mid height, where a holding thumb rests.
export const container =
  "absolute bottom-0 left-0 top-0 z-10 flex w-1/2 touch-none select-none items-center justify-start bg-gradient-to-r from-shade/25 to-transparent pb-[5.5rem] pl-[7%]";

// The teaching glyph: a thumb ring with the two ways either side, and the one line under it.
// Big and faint, there for a block's first touch and gone once the thumbs have found it.
// Faint, but over a busy storefront it still has to read: a soft shade under the strokes and
// the line, never a box.
const ghost =
  "pointer-events-none text-text/40 transition-opacity duration-500 [text-shadow:0_1px_8px_theme(colors.shade/90%)]";

export const glyph = `${ghost} flex flex-col items-center gap-[clamp(0.35rem,1.2vh,0.75rem)]`;

export const glyphRow = "flex items-center gap-[clamp(0.5rem,1.4vw,1rem)]";

export const glyphArrow = "font-score text-[clamp(1.8rem,min(4.5vw,8vh),3.25rem)] leading-none";

export const glyphRing =
  "block h-[clamp(4rem,min(9vw,15vh),6.5rem)] w-[clamp(4rem,min(9vw,15vh),6.5rem)] rounded-full border-4 border-text/30 bg-shade/25 shadow-[0_0_18px_theme(colors.shade/45%)]";

export const glyphCaption =
  "whitespace-nowrap font-score text-[clamp(0.7rem,min(1.35vw,2.4vh),0.95rem)] font-bold uppercase tracking-[0.18em] text-text/60";

export const faded = "opacity-0";

// The live stick under a held thumb: a ring where the thumb's centre is, a dot that follows the
// thumb's pull, and the way she is walking lit either side. Placed by the pointer handlers; shown
// only while the pad is held. Muted, so it reads as the thumb's shadow and not a control.
export const stick =
  "group pointer-events-none absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 data-[brawl-thumb-held=true]:opacity-100";

export const stickRing = "flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border-2 border-text/20 bg-shade/20";

export const stickDot = "block h-5 w-5 rounded-full bg-text/30";

const stickArrow = "font-score text-xl leading-none text-text/15";

export const stickArrowLeft = `${stickArrow} group-data-[brawl-thumb-dir=left]:text-text/50`;

export const stickArrowRight = `${stickArrow} group-data-[brawl-thumb-dir=right]:text-text/50`;
