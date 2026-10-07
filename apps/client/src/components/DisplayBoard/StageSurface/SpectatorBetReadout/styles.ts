import { readoutFigure } from "@wingnight/surface";

// The watchers' line on the briefing and the wings (DESIGN.md §2.2D, "the readout"): the Neon Heat
// Line's readout type — mutedWarm caps, clamp-sized — with the line itself as a `readoutFigure`
// in white light. The count beside it and nothing more: no pick, no name, no gold (gold is points
// won, and nobody has won anything yet).
export const readout =
  "m-0 inline-flex items-baseline gap-[clamp(0.6rem,1.2vw,1.2rem)] text-[clamp(0.8rem,1.05vw,1.15rem)] font-extrabold uppercase tracking-[0.24em] text-mutedWarm";

export const figure = `${readoutFigure} text-text`;

export const separator = "text-mutedWarm/60";
