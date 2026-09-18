import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the course is seeded from the team and leg. Two legs of
// three gates keeps a sandbox relay short enough to walk end to end; a real
// night runs the rules in content/sample/gameConfig.json.
export const fappyDevManifest = createDevManifest({
  rules: { legsPerTurn: 2, gatesPerLeg: 3, pointsPerGate: 1 },
  content: null
});
