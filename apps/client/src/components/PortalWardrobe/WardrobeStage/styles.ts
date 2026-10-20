// The stage: about 40% of a phone's height, the hearth's heat pooled under the bird like the
// studio's (PortalHeadBird), the pill in its corner. At TV size it goes dark, as the room is.
const stageBase = "relative flex h-[min(20rem,40svh)] items-end justify-center overflow-hidden rounded-xl pb-3";

export const stage = `${stageBase} bg-[radial-gradient(ellipse_at_50%_100%,theme(colors.primary/22%)_0%,transparent_70%)]`;

export const stageTv = `${stageBase} bg-bg`;

export const birdButton =
  "flex h-full w-full cursor-pointer items-end justify-center border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow aria-disabled:cursor-default";

export const bird = "block h-[min(16rem,33svh)]";

export const hint = "pointer-events-none absolute left-3 top-3 text-[0.72rem] text-mutedWarmDim";

const pillBase =
  "absolute right-2.5 top-2.5 inline-flex min-h-[36px] items-center rounded-full px-3 text-[0.64rem] font-bold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const tvPill = `${pillBase} border border-text/15 bg-bg/60 text-text`;

export const tvPillOn = `${pillBase} border border-primary bg-primary/20 text-text`;

export const tvRow = "flex items-end gap-6 pb-1";

export const tvFigure = "m-0 flex flex-col items-center gap-1.5";

// The bird box at the room's sizes, in CSS pixels as a 1080p TV draws them. The parade's is
// softened to what a guest on the couch, three metres off, can make out.
export const tvBird130 = "block h-[130px] [filter:blur(1px)]";

export const tvBird76 = "block h-[76px]";

export const tvCaption = "text-[0.62rem] uppercase tracking-[0.1em] text-mutedWarmDim";
