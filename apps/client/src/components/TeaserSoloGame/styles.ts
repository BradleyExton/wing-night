// The teaser's own rail in the zone's chrome row, where the party shell puts its mini-rail: the
// way home and the game's name, on the same dark chip the rail uses.
export const rail =
  "inline-flex items-center gap-2 rounded-full border border-text/10 bg-shade/60 py-1.5 pl-2.5 pr-3.5 text-sm font-bold uppercase tracking-[0.14em] text-text no-underline backdrop-blur-[3px]";

export const railBack =
  "h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-mutedWarm";

export const railBrand = "text-mutedWarm";

export const railTitle = "text-primary";

// A runner wants the street left to right, so a phone held upright gets asked to turn instead
// of a street squeezed into a letterbox.
export const rotate =
  "fixed inset-0 z-40 hidden flex-col items-center justify-center gap-2 bg-bg px-8 text-center portrait:flex";

export const rotateTitle = "m-0 text-2xl font-black uppercase leading-tight text-text";

export const rotateBody = "m-0 font-voice text-lg italic text-mutedWarm";

// A phone with rotation lock on never turns, so without this the card is a dead end.
export const rotateLockHint = "m-0 mt-4 text-sm text-mutedWarm/80";
