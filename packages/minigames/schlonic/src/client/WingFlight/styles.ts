// Over the whole stage, under the pointer: the wings fly from the zone to the marquee, and both
// are inside the stage, so the layer's origin is the stage's own corner.
export const layer = "pointer-events-none absolute inset-0 z-20 overflow-visible";

// Each wing is a fixed box at the layer's origin, centred on it, invisible until thrown; the
// flight moves it with a transform, so nothing lays out.
export const wing =
  "absolute left-0 top-0 h-[clamp(1.6rem,2.6vh,2.6rem)] w-[clamp(1.6rem,2.6vh,2.6rem)] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform";
