// The frame is whatever box the surface gives the scene; the scene inside it is either the
// tablet's 16:9 street letterboxed into it with container units, or — for a filling camera — the
// whole of it, with the camera widened to the box's own aspect (`camera/index.ts`).
export const frame = "relative flex h-full min-h-0 w-full items-center justify-center [container-type:size]";

// Night on the street: the house's own dark running down into the hearth's warm glass at the
// horizon, the way a downtown sky glows over the lamps. Scene art (DESIGN.md §2.11's licence),
// but drawn in the house tokens rather than a palette of its own.
const sceneSky = "bg-[linear-gradient(180deg,theme(colors.bg)_0%,theme(colors.bg)_22%,theme(colors.hearthGlass)_62%,theme(colors.hearthGlass)_100%)]";

// The night palette every drawing in the scene paints with, as custom properties on the scene's
// root. `@wingnight/scenery` takes its colours as presentation attributes, which cannot take a
// class — so the tokens reach it as `var(--bn-*)` (`palette.ts`), set here from the theme.
// Every one is written out whole, because Tailwind only generates a class it can read whole.
const sceneNightBuildings =
  "[--bn-wall:theme(colors.surfaceAlt)] [--bn-wall-dark:theme(colors.surface)] [--bn-buff:theme(colors.mutedWarmDim)] [--bn-buff-dark:theme(colors.hearthGlass)] [--bn-trim:theme(colors.mutedWarmDim)] [--bn-pane:theme(colors.ember/55%)] [--bn-awning:theme(colors.heat/70%)]";

const sceneNightSigns =
  "[--bn-sign:theme(colors.gold)] [--bn-sign-ink:theme(colors.bg)] [--bn-sign-green:theme(colors.success)] [--bn-sign-green-light:theme(colors.success/60%)] [--bn-flag:theme(colors.heat)]";

const sceneNightTown =
  "[--bn-town:theme(colors.surface)] [--bn-town-dark:theme(colors.bg)] [--bn-town-glass:theme(colors.ember/35%)] [--bn-steel:theme(colors.mutedWarm)] [--bn-steel-dark:theme(colors.mutedWarmDim)] [--bn-mound:theme(colors.surfaceAlt)]";

const sceneNightGround =
  "[--bn-sidewalk:theme(colors.mutedWarmDim)] [--bn-joint:theme(colors.surfaceAlt)] [--bn-kerb:theme(colors.mutedWarm)] [--bn-road:theme(colors.surface)] [--bn-lane:theme(colors.gold/60%)] [--bn-plank:theme(colors.hearthGlass)] [--bn-sand:theme(colors.mutedWarmDim)] [--bn-chalk:theme(colors.text/85%)]";

const sceneNightLight =
  "[--bn-water:theme(colors.surfaceAlt)] [--bn-glint:theme(colors.glowHot/45%)] [--bn-lamp:theme(colors.glowHot)] [--bn-lamp-glow:theme(colors.ember/18%)] [--bn-post:theme(colors.surface)] [--bn-moon:theme(colors.glowHot)] [--bn-star:theme(colors.glow/60%)] [--bn-shadow:theme(colors.shade/45%)]";

const sceneBase = `relative overflow-hidden ${sceneSky} ${sceneNightBuildings} ${sceneNightSigns} ${sceneNightTown} ${sceneNightGround} ${sceneNightLight}`;

export const sceneFixed = `${sceneBase} h-[min(100cqh,56.25cqw)] w-[min(100cqw,177.7778cqh)]`;

export const sceneFill = `${sceneBase} h-full w-full`;

export const world = "absolute inset-0 h-full w-full overflow-visible";

export const label = "sr-only";
