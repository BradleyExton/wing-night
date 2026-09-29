// The backdrop sits under the gate layer, filling the scene. Each skyline
// band is its own SVG, two tiles wide in world units (`--fappy-unit` is one),
// so the loop slides it with a composited transform and the browser never
// repaints the city while the corridor scrolls over it.
export const backdrop = "pointer-events-none absolute inset-0 overflow-hidden";

export const still = "absolute inset-0 h-full w-full";

// Two FAR_SKYLINE_TILE (260) and two NEAR_SKYLINE_TILE (300) wide.
export const farBand = "absolute left-0 top-0 h-full w-[calc(520*var(--fappy-unit))] will-change-transform";

export const nearBand = "absolute left-0 top-0 h-full w-[calc(600*var(--fappy-unit))] will-change-transform";
