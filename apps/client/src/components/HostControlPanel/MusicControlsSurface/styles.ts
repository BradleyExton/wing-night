export {
  deckGroupRoot as group,
  deckGroupHead as groupHead,
  deckGroupCount as groupCount,
  deckCtrlButton as button
} from "../styleTokens";

// Two equal thumb targets rather than the timer's `1.4fr 1fr 1fr`: there are
// only two controls, and the tablet is sauce-covered (DESIGN.md §2.1), so they
// each get half the deck's width.
export const controls = "grid grid-cols-2 gap-1.5";

export const trackTitle =
  "mb-2 px-1.5 text-[clamp(0.95rem,1.15vw,1.1rem)] font-semibold text-text";

export const trackPosition =
  "mt-1 block text-[0.72rem] font-bold uppercase tracking-[0.2em] text-muted";
