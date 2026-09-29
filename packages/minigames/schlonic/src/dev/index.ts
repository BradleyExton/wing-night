import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the street is seeded from the rules. Two legs of fourteen chunks keeps a
// sandbox turn walkable end to end while still dealing every piece of kit — the first leg opens
// on a grind rail over a thorn bed, puts a pit a third of the way in so a sandbox run that
// nobody plays ends where it should, and leaves the springboard to the finale; the second leg
// picks the kit rotation up where the first left it. A low par lets the score climb where it
// can be seen; a real night runs the rules in content/sample/gameConfig.json.
export const schlonicDevManifest = createDevManifest({
  rules: { runsPerTurn: 2, zoneSeed: 4, zoneChunks: 14, parWingsPerRun: 26 },
  content: null
});
