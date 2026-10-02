// The goons BRAWL's hen pecks her way through (docs/minigames/brawl-spec.md §0.8): the goose, the
// gull, the raccoon, the swan, the helmet goose and the boss goose, each a bare <g> in world units
// with a `state` prop — and the clank a peck makes off the helmet.
export { Goon } from "./Goon/index.js";
export { Boss } from "./Boss/index.js";
export { Clank, CLANK_TICKS } from "./Clank/index.js";
export { Goose } from "./Goose/index.js";
export { Gull, GULL_ART_HEIGHT } from "./Gull/index.js";
export { Helmet, HELMET_ART_HEIGHT } from "./Helmet/index.js";
export { Raccoon, RACCOON_ART_HEIGHT } from "./Raccoon/index.js";
export { Swan, SWAN_ART_HEIGHT } from "./Swan/index.js";
export { GOOSE_ART_HEIGHT } from "./GooseFigure/index.js";
export { brawlGoonPalette, type BrawlGoonPalette } from "./palette.js";
export { GOON_WALK_FRAME_TICKS, type GoonProps } from "./rig/index.js";
