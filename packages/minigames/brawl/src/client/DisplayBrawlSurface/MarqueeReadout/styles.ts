import { readoutFigure } from "@wingnight/surface";

// The marquee sets the readout's label type (DESIGN.md §2.2D); the live figures here wear the
// house `readoutFigure` and choose only their colour.

// "Block 2 of 3 · Alex": the label type, with the player's name lit in white so the room reads
// whose block it is from the sofa.
export const blockName = "text-text";

// The hearts are the shared `HeartRow`, in its marquee tone.

// The worth down over the course's worth: the score, in gold.
export const goons = `${readoutFigure} text-gold`;

// The turn to beat: dimmer than the team's gold, because it is the target and not the score.
export const best = `${readoutFigure} text-text/70`;
