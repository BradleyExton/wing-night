// The right thumb: the right half of the arena, any touch a peck and a hold a stream of them. It
// stops short of the bottom edge so the corner dock's circle is never under it — a mashed peck
// must not land on the dock. Its ring sits toward the right edge at mid height, where the right
// thumb rests on a held tablet.
export const container =
  "absolute bottom-[5.5rem] left-1/2 right-0 top-0 z-10 flex touch-none select-none items-center justify-end pr-[7%]";

// Faint, but over a busy storefront it still has to read: a soft shade under the strokes and
// the line, never a box.
const ghost =
  "pointer-events-none text-text/40 transition-opacity duration-500 [text-shadow:0_1px_8px_theme(colors.shade/90%)]";

export const glyph = `${ghost} flex flex-col items-center gap-[clamp(0.35rem,1.2vh,0.75rem)]`;

export const glyphRing =
  "flex h-[clamp(5.5rem,min(13vw,22vh),9.5rem)] w-[clamp(5.5rem,min(13vw,22vh),9.5rem)] items-center justify-center rounded-full border-4 border-text/30 bg-shade/25 shadow-[0_0_18px_theme(colors.shade/45%)] font-score text-[clamp(1rem,min(2.4vw,4vh),1.7rem)] font-extrabold tracking-[0.2em]";

export const glyphCaption =
  "whitespace-nowrap font-score text-[clamp(0.7rem,min(1.35vw,2.4vh),0.95rem)] font-bold uppercase tracking-[0.18em] text-text/60";

export const faded = "opacity-0";
