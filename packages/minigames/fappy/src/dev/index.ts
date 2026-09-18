import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the course is seeded from the team and leg. Two legs of
// three gates keeps a sandbox relay short enough to walk end to end, and a
// short par and limit let the score slide and the timeout be seen without
// waiting two real minutes; a real night runs the rules in
// content/sample/gameConfig.json.
export const fappyDevManifest = createDevManifest({
  rules: { legsPerTurn: 2, gatesPerLeg: 3, parSeconds: 20, limitSeconds: 60 },
  content: null
});
