import { readoutFigure } from "@wingnight/surface";

// The relay's own readouts in the TV marquee's `readout` slot
// (`<NeonMarquee>` from @wingnight/surface, DESIGN.md §2.2D). The marquee sets
// the label type — "LEG 1 OF 5", "0 / 30 GATES" — so only the live numbers are
// styled here, as the house `readoutFigure`. Each state is its own complete
// string rather than a colour stacked on a base: two `text-*` colours on one
// element are decided by the stylesheet's order, not the attribute's.

// The relay clock is the room's scoreboard while the bird is in the air: white,
// gold once it has run past par, heat in the last fifteen seconds of the limit.
export const marqueeClock = `${readoutFigure} text-text`;

export const marqueeClockPastPar = `${readoutFigure} text-gold`;

export const marqueeClockUrgent = `${readoutFigure} text-heat`;

// What a finish right now would pay, the second thing read after the clock —
// the clock is only pressure once the room can see what it is spending. Gold
// while par is intact, heat once every tenth is costing a point.
export const marqueePointsCell = "flex flex-col items-end leading-none";

export const marqueePoints = `${readoutFigure} text-gold`;

export const marqueePointsDraining = `${readoutFigure} text-heat`;

export const marqueeParHint = "mt-1 text-[0.8em] text-mutedWarmDim";

// The target: the slowest finish that still tops the best rival this round.
export const marqueeBeat = "max-w-[14ch] text-right leading-tight text-primary";
