// Height-bound, not width-bound: the board takes the height the marquee and
// the status line leave and derives its width from the 6:5 aspect. Sizing it
// from the width instead (w-full) overflows a 1080p TV by ~280px, which eats
// the bottom rows of slots and the status line under them.
export const board =
  "grid aspect-[6/5] h-full max-h-full w-auto max-w-[min(100%,1500px)] grid-cols-6 grid-rows-5 gap-[clamp(0.4rem,0.9vw,0.9rem)] transition-opacity duration-[240ms]";

// Emoji never scale with sequence length (DESIGN.md §2.6): a cell is sized
// from the space the board got, so a 3-emoji clue and a 28-emoji one are
// equally legible from the sofa.
const slotBase =
  "flex items-center justify-center rounded-2xl text-[min(11vh,6.4vw)] leading-none [filter:drop-shadow(0_4px_12px_theme(colors.shade/50%))]";

export const slotFilled = `${slotBase} bg-text/[0.045]`;

// Newest slot keeps the one beat of drama borrowed from the ribbon direction.
export const slotNewest = `${slotBase} bg-gold/[0.14] shadow-[inset_0_0_0_3px_theme(colors.gold),0_0_26px_theme(colors.gold/25%)] motion-safe:animate-[emojipop_420ms_cubic-bezier(0.2,1.4,0.4,1)]`;

// The clue the room has not seen yet, kept on screen so it can read how much
// is still to come.
export const slotEmpty =
  "rounded-2xl border-2 border-dashed border-text/[0.06] bg-text/[0.015]";

// Recessed, not erased: the reveal plaque sits over a clue the room can still
// read, the way DRAWING holds its sketch under the verdict.
export const boardDimmed = "opacity-30";
