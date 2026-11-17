// The stage: about a quarter of a phone's height, short enough to stay pinned over the Looks
// and the rail, the hearth's heat pooled under the bird like the studio's (PortalHeadBird).
export const stage =
  "relative flex h-[min(13rem,28svh)] items-end justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_100%,theme(colors.primary/22%)_0%,transparent_70%)] pb-3";

export const birdButton =
  "flex h-full w-full cursor-pointer items-end justify-center border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow aria-disabled:cursor-default";

// The bird's box is its 72-unit body; a photo head rises 12 units past the top of it. Sized so
// that head clears the top of the stage with room for its idle bob, on a phone tall or short:
// (stage − foot padding − 16px) × 72 ÷ 84 is about 20svh while the stage is 28svh, and 9.5rem
// where the stage stops growing.
export const bird = "block h-[min(9.5rem,20svh)]";

export const hint = "pointer-events-none absolute left-3 top-3 text-[0.72rem] text-mutedWarmDim";
