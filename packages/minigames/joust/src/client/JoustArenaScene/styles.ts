export const frame = "relative h-full min-h-0 w-full";

// overflow-visible lets the backdrop paint past the 160×90 world into whatever letterbox the
// frame leaves, so a lane in a frame that is not 16:9 meets its edges with sky and sand rather
// than a seam. Everything that moves stays inside the world clip.
export const svg = "block h-full w-full select-none overflow-visible";
