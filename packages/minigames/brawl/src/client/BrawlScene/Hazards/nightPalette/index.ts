import type { brawlNight } from "../../palette.js";

/**
 * The night palette a hazard paints with: the scene's `--bn-*` custom properties as `var(--bn-…)`
 * strings (`BrawlScene/palette.ts`), handed in as a prop the way the scenery takes its colours.
 * A hazard is scene art like the backdrop, drawn in presentation attributes rather than classes,
 * so no hex lives in it and a sandbox can hand in another night.
 */
export type BrawlNightPalette = typeof brawlNight;
