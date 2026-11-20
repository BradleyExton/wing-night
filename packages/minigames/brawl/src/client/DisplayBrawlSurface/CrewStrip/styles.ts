// The crew strip sits in the marquee's readout (DESIGN.md §2.2D, §2.14): a row of chips, one a
// hen, sized in `vw` like the sign's own type so it reads from the couch and costs the street
// nothing. Normal case and no tracking: these are names, not labels.
export const strip = "flex items-end gap-[clamp(0.5rem,1vw,1.2rem)] normal-case tracking-normal";

export const chip =
  "group flex w-[clamp(3rem,4.6vw,5.4rem)] flex-col items-center gap-[0.15em] text-center transition-[opacity,filter] duration-200 data-[state=down]:grayscale data-[state=away]:opacity-45";

export const face = "relative block h-[clamp(2.2rem,3.4vw,4rem)] w-[clamp(2.2rem,3.4vw,4rem)]";

export const head = "absolute inset-[7%] block overflow-hidden rounded-full bg-surface group-data-[state=down]:opacity-50";

// The ring is the hen's slot colour, the one thing that is hers alone in a team of one colour.
export const ring = "absolute inset-0 block h-full w-full";

// The clean-wave star: gold while the wave has not touched her, gone the moment it does.
export const star =
  "absolute -right-[12%] -top-[14%] font-score text-[clamp(0.8rem,1.2vw,1.4rem)] leading-none text-gold transition-[opacity,transform] duration-200 [text-shadow:0_0_8px_theme(colors.gold/70%)] data-[clean=false]:scale-50 data-[clean=false]:opacity-0";

export const name =
  "block w-full truncate font-score text-[clamp(0.7rem,0.95vw,1.05rem)] font-bold leading-none text-text group-data-[state=down]:text-heat";

export const hearts = "flex gap-[0.1em] font-score text-[clamp(0.7rem,1vw,1.15rem)] leading-none";

export const heart = "text-heat transition-opacity duration-150 data-[lit=false]:text-muted data-[lit=false]:opacity-30";
