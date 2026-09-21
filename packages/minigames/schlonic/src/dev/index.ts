import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the zone is seeded from the rules. Two runs over fourteen chunks keeps a
// sandbox turn walkable end to end while still dealing all four pieces of hard kit — this seed
// puts a pit a third of the way in, so a sandbox run that nobody plays ends where it should. A
// low par lets the score climb where it can be seen; a real night runs the rules in
// content/sample/gameConfig.json.
export const schlonicDevManifest = createDevManifest({
  rules: { runsPerTurn: 2, zoneSeed: 4, zoneChunks: 14, parWingsPerRun: 26 },
  content: null
});
