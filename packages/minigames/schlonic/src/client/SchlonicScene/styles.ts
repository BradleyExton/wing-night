// The frame is whatever box the surface gives the scene; the scene inside it is either the
// tablet's 16:9 world letterboxed into it with container units, or — for a filling camera — the
// whole of it, with the camera widened to the box's own aspect (`camera/index.ts`).
export const frame = "relative flex h-full min-h-0 w-full items-center justify-center [container-type:size]";

// Morning sky over Kempenfelt Bay, paling into the haze where the far bank sits: the one
// minigame in the night that is supposed to read as a 16-bit platformer at a glance, and the one
// that is supposed to read as home.
// Scene art, licensed by DESIGN.md §2.11: the bay's summer sky.
const sceneSky = "bg-[linear-gradient(180deg,#1f7fc4_0%,#6dc0ea_58%,#cfeaf7_100%)]";

const sceneBase = `relative overflow-hidden ${sceneSky}`;

export const sceneFixed = `${sceneBase} h-[min(100cqh,56.25cqw)] w-[min(100cqw,177.7778cqh)]`;

export const sceneFill = `${sceneBase} h-full w-full`;

export const world = "absolute inset-0 h-full w-full overflow-visible";

export const label = "sr-only";
