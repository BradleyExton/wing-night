// The frame is whatever box the surface gives the scene; the camera is widened to the box's own
// aspect (`camera/`), so the scene fills it edge to edge and nothing is letterboxed or stretched.
export const frame = "relative h-full min-h-0 w-full overflow-hidden";

// Dusk over Kempenfelt Bay: the house's own dark running down into the hearth's warm glass and a
// last band of the show's orange at the horizon. Screen space, not world space: the sky is mood,
// and it stays put while the camera climbs.
const sceneSky =
  "bg-[linear-gradient(180deg,theme(colors.bg)_0%,theme(colors.surface)_30%,theme(colors.hearthGlass)_72%,theme(colors.primary/30%)_100%)]";

// The palette every drawing in the scene paints with (`palette.ts`), set here from the theme.
// Written out whole, because Tailwind only generates a class it can read whole.
const sceneShore =
  "[--mt-water:theme(colors.surfaceAlt)] [--mt-glint:theme(colors.ember/35%)] [--mt-shore:theme(colors.surface)] [--mt-ground:theme(colors.hearthGlass)] [--mt-ground-edge:theme(colors.mutedWarmDim)] [--mt-plank:theme(colors.bg/45%)]";

const sceneStone =
  "[--mt-stone:theme(colors.surfaceAlt)] [--mt-stone-dark:theme(colors.surface)] [--mt-stone-edge:theme(colors.mutedWarmDim)] [--mt-steel:theme(colors.mutedWarmDim)] [--mt-steel-dark:theme(colors.surfaceAlt)] [--mt-mound:theme(colors.surface)] [--mt-shadow:theme(colors.shade/40%)]";

export const scene = `absolute inset-0 ${sceneSky} ${sceneShore} ${sceneStone}`;

export const world = "absolute inset-0 h-full w-full";

export const label = "sr-only";

// The tablet's arrow on the top edge when the line is above the close-up: "1.4 hens to the line".
// Glass over the sky, in the score face, and it never takes the pointer.
export const lineArrow =
  "pointer-events-none absolute left-1/2 top-[3.75rem] -translate-x-1/2 rounded-full border border-gold/50 bg-bg/80 px-3 py-1 font-score text-[1.05rem] font-extrabold uppercase tracking-[0.12em] text-gold tabular-nums backdrop-blur data-[hidden=true]:hidden";
