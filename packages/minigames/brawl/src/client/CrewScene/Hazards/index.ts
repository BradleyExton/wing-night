// The hazard each block carries (docs/research/brawl-depth-and-strategy.md, feature 7): a thing a
// goon can be shoved past, one per setting. Static scenery in world units, each a bare <g> stood
// on the ground line from `x` across `width`, painted in the scene's night palette the way the
// backdrop is. `Hazard` picks the block's own; the dunk's splash is `../DunkSplash`.
export { Hazard } from "./Hazard/index.js";
export { Railing } from "./Railing/index.js";
export { BayEdge } from "./BayEdge/index.js";
export { Plinth } from "./Plinth/index.js";
export type { BrawlNightPalette } from "./nightPalette/index.js";
