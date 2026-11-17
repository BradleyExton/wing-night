// The stage with its foot: the status line and the TV-size pill on one row under it.
export const root = "flex flex-col gap-2";

// The stage: about a quarter of a phone's height, short enough to stay pinned over the Looks
// and the rail, the hearth's heat pooled under the bird like the studio's (PortalHeadBird). At
// TV size it goes dark, as the room is, and grows to hold the 130px bird and its head.
const stageBase = "relative flex items-end justify-center overflow-hidden rounded-xl pb-3";

export const stage = `${stageBase} h-[min(13rem,28svh)] bg-[radial-gradient(ellipse_at_50%_100%,theme(colors.primary/22%)_0%,transparent_70%)]`;

export const stageTv = `${stageBase} h-[min(20rem,40svh)] bg-bg`;

export const birdButton =
  "flex h-full w-full cursor-pointer items-end justify-center border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow aria-disabled:cursor-default";

// The bird's box is its 72-unit body; a photo head rises 12 units past the top of it. Sized so
// that head clears the top of the stage with room for its idle bob, on a phone tall or short:
// (stage − foot padding − 16px) × 72 ÷ 84 is about 20svh while the stage is 28svh, and 9.5rem
// where the stage stops growing.
export const bird = "block h-[min(9.5rem,20svh)]";

export const hint = "pointer-events-none absolute left-3 top-3 text-[0.72rem] text-mutedWarmDim";

export const foot = "flex items-center gap-3";

const pillBase =
  "inline-flex min-h-[44px] flex-none items-center rounded-full px-3.5 text-[0.64rem] font-bold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const tvPill = `${pillBase} border border-text/15 bg-bg/60 text-text`;

export const tvPillOn = `${pillBase} border border-primary bg-primary/20 text-text`;

export const tvRow = "flex items-end gap-6 pb-1";

export const tvFigure = "m-0 flex flex-col items-center gap-1.5";

// The bird box at the room's sizes, in CSS pixels as a 1080p TV draws them. The parade's is
// softened to what a guest on the couch, three metres off, can make out.
export const tvBird130 = "block h-[130px] [filter:blur(1px)]";

export const tvBird76 = "block h-[76px]";

export const tvCaption = "text-[0.62rem] uppercase tracking-[0.1em] text-mutedWarmDim";
