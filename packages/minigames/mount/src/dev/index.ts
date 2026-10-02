import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the pile starts from a seed in the rules. The sample rules' defaults, so the
// sandbox goose is the night's goose: three players a team, so three climbs of 5 points each, and
// the sandbox's team switch hands the first team's pile to the next (spec §0.9).
export const mountDevManifest = createDevManifest({
  rules: { climbSeconds: 30, secondsPerHen: 3, pileSeed: 20261002 },
  content: null
});
