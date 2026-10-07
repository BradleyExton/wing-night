import { readoutFigure } from "@wingnight/surface";

// The marquee sets the readout's label type (DESIGN.md §2.2D); the live figures wear the house
// `readoutFigure` and choose only their colour.

// "Climb 2 of 4 · Caitlin": the label type, with the climber's name lit in white.
export const climbName = "text-text";

// The climb's clock: white, and the house last-ten treatment under ten seconds — larger, in heat.
export const clock = `${readoutFigure} text-text transition-[font-size] duration-150 data-[last-ten=true]:text-heat data-[last-ten=true]:text-[clamp(1.8rem,3vw,3.2rem)]`;

// The line's holder, in gold: the number the room is shouting at.
export const lineHolder = `${readoutFigure} text-gold`;

export const lineHeight = "text-text/80";

// The turn's points so far, in the score face and gold, the moment the server banks a climb.
export const points = `${readoutFigure} text-gold`;
