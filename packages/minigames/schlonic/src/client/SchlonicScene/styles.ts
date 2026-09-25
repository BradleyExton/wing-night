// The scene is a 16:9 box letterboxed into whatever frame holds it, using container units so the
// tablet and the TV map the same world identically. `--schlonic-unit` is one world unit (the box
// is 160 wide), so anything sized in world units multiplies by it.
export const frame = "relative flex h-full min-h-0 w-full items-center justify-center [container-type:size]";

// Morning sky over Kempenfelt Bay, paling into the haze where the far bank sits: the one
// minigame in the night that is supposed to read as a 16-bit platformer at a glance, and the one
// that is supposed to read as home.
// Scene art, licensed by DESIGN.md §2.11: the bay's summer sky.
const sceneSky = "bg-[linear-gradient(180deg,#1f7fc4_0%,#6dc0ea_58%,#cfeaf7_100%)]";

export const scene = `relative h-[min(100cqh,56.25cqw)] w-[min(100cqw,177.7778cqh)] overflow-hidden [container-type:size] [--schlonic-unit:0.625cqw] ${sceneSky}`;

export const world = "absolute inset-0 h-full w-full overflow-visible";

export const label = "sr-only";
