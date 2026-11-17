// The Looks: two across, each a square big enough to read a whole bird in over its name, the
// worn one ringed in `primary` like a tile on the rail.
export const grid = "grid grid-cols-2 gap-x-2 gap-y-3";

export const look =
  "flex min-w-0 flex-col gap-1.5 rounded-xl border-0 bg-transparent p-0 transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

const pictureBase =
  "relative block aspect-square overflow-hidden rounded-xl border bg-[radial-gradient(ellipse_at_50%_70%,theme(colors.primary/16%)_0%,transparent_75%)]";

export const picture = `${pictureBase} border-ember/20`;

export const pictureOn = `${pictureBase} border-primary ring-2 ring-primary`;

const nameBase = "truncate text-center text-[0.8rem] font-extrabold uppercase tracking-[0.08em]";

export const name = `${nameBase} text-mutedWarm`;

export const nameOn = `${nameBase} text-text`;

// The dice is a Look that has not been drawn yet: a dashed square in the cell an odd number of
// Looks leaves empty, or, when the Looks fill their rows, a bar under them.
const diceFrame = "rounded-xl border border-dashed border-primary/60 bg-primary/10";

export const dicePicture = `${diceFrame} flex aspect-square items-center justify-center text-[2.5rem] leading-none`;

export const diceWide = `${diceFrame} col-span-2 flex min-h-[52px] items-center justify-center gap-2 text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-text transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow`;

export const diceMarkWide = "text-[1.2rem] leading-none";
