// The scene is a 16:9 box letterboxed into whatever frame holds it, using
// container units so the tablet and the TV map the same world identically.
// `--fappy-unit` is one world unit (the box is 160 wide), so anything sized
// in world units multiplies by it.
export const frame = "relative flex h-full min-h-0 w-full items-center justify-center [container-type:size]";

export const scene =
  "relative h-[min(100cqh,56.25cqw)] w-[min(100cqw,177.7778cqh)] overflow-hidden [container-type:size] [--fappy-unit:0.625cqw] bg-[linear-gradient(180deg,#160c2a_0%,#4a1f3f_58%,#c2582c_93.2%,#d6ac63_93.3%,#b58a45_100%)]";

export const gateLayer = "absolute inset-0 h-full w-full overflow-visible";

// The bird's box is 16 world units wide and 14.4 tall (the hen's 80×72 at a
// fifth), its centre pinned on the world's bird x; the loop translates and
// tilts it with a transform, so the browser composites it and never re-lays
// out the scene. The transform lives on this wrapper, not on the hen's own
// svg, so its halo filter is rasterised once and moved, never recomputed.
export const bird =
  "absolute left-[20cqw] top-0 h-[9cqw] w-[10cqw] origin-center will-change-transform";

// The next player's bird, standing on the landing plateau facing the flyer.
// Same box as the bird; the loop places it in world units and flips it.
export const waitingBird =
  "absolute left-0 top-0 h-[9cqw] w-[10cqw] origin-center will-change-transform";

export const label = "sr-only";
