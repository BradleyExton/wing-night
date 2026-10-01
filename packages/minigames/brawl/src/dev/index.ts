import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the street is seeded from the rules. Two blocks keeps a sandbox turn short
// enough to fight end to end — Dunlop Street, then the waterfront with its raccoon — on the same
// seed the sample rules use, so the sandbox street is the night's street.
export const brawlDevManifest = createDevManifest({
  rules: { blocksPerTurn: 2, courseSeed: 20261001 },
  content: null
});
