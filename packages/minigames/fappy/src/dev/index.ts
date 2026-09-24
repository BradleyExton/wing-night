import { createDevManifest } from "@wingnight/minigames-core";

// No content file: the course is seeded from the team and leg. Two legs of
// three gates keeps a sandbox relay short enough to walk end to end, and a
// short par and limit let the score slide and the timeout be seen without
// waiting two real minutes; a real night runs the rules in
// content/sample/gameConfig.json.
const baseManifest = createDevManifest({
  rules: { legsPerTurn: 2, gatesPerLeg: 3, parSeconds: 20, limitSeconds: 60 },
  content: null
});

// One rival already on the board. The shared fixture banks nobody any points,
// and a relay with nothing to chase cannot show the half of the pressure pass
// that exists to answer "how long have we got?" — the time-to-beat is inverted
// from a rival's POINTS (the runtime is re-initialised per team turn, so their
// time is long gone), so a sandbox with a zeroed bank has no target to draw.
export const fappyDevManifest = {
  ...baseManifest,
  pendingPointsByTeamId: { ...baseManifest.pendingPointsByTeamId, "team-beta": 9 }
};
