import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the base is seeded from the rules. The whole base, on the seed the teaser plays,
// so the sandbox's base is the one a room runs.
export const bordenDevManifest = createDevManifest({
  rules: { stretchesPerTurn: 3, courseSeed: 20261120 },
  content: null
});
