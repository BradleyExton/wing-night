// The street is drawn in world units on three stacked layers inside a 16:9 WINDOW, and the window
// is fitted to whatever box the surface gives the scene: the wall's wide arena is covered (the
// window is as wide as the box and gives up sky from the top), the tablet's is contained (the
// whole window, with more street showing either side rather than bars). Container units do the
// fitting, so nothing here measures anything.
//
// Three layers, because only one of them changes: the sky and the street are each drawn ONCE a
// block and then only ever slid by a CSS transform, which the compositor does without painting
// anything again; the figures — the few things that move — are the only layer that repaints.
// One `<svg>` for all of it re-rastered every storefront on every frame a goose took a step.

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

export const frame = `relative h-full w-full overflow-hidden [container-type:size] ${sceneSky} ${sceneNightBuildings} ${sceneNightSigns} ${sceneNightTown} ${sceneNightGround} ${sceneNightLight}`;

const windowBase = "absolute bottom-0 left-1/2 -translate-x-1/2";

export const windowCover = `${windowBase} h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.7778cqh)]`;

export const windowContain = `${windowBase} h-[min(100cqh,56.25cqw)] w-[min(100cqw,177.7778cqh)]`;

// The two layers that are drawn once and slid: each is wider than the window (its `left` and
// `width` are set from its own extent, `index.tsx`) and is promoted to its own compositor layer.
export const slidLayer = "absolute top-0 block h-full max-w-none [will-change:transform]";

// The figures: exactly the window, with everything outside it still drawn — a goose walking in
// from past the edge is on the tablet's spare street before it is in the window.
export const figureLayer = "absolute inset-0 block h-full w-full overflow-visible";
