import { createDevManifest } from "@wingnight/minigames-core";

// Mirrors content/sample/gameConfig.json's minigameRules.spotter, plus a
// pinned seed so sandbox play (and the e2e suite driving it) sees the same
// field every time. A real night rolls a fresh seed per turn.
export const SPOTTER_DEV_SEED = 20260916;

export const spotterDevManifest = createDevManifest({
  rules: {
    targetsPerTurn: 5,
    gridCols: 13,
    gridRows: 7,
    seed: SPOTTER_DEV_SEED
  },
  content: null
});
