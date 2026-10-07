import type { FappyMinigameHostView } from "@wingnight/shared";

import { resolveRelayChase } from "../../pressure/index.js";
import { formatRelayClockSeconds } from "../../useRelayClock/index.js";
import { hostFappySurfaceCopy } from "../copy.js";

// The line under the running totals: the slowest finish that still tops the
// best rival this round, or par when even that would not do it. The par line
// when there is nobody to chase yet.
export const resolveTotalsNote = (
  view: FappyMinigameHostView,
  teamNameByTeamId: Map<string, string>
): string => {
  const chase = resolveRelayChase(view);

  if (chase === null || view.phase === "finished" || view.phase === "timedOut") {
    return hostFappySurfaceCopy.parLine(view.parSeconds);
  }

  const rivalName = teamNameByTeamId.get(chase.teamId) ?? null;

  return chase.timeToBeatMs === null
    ? hostFappySurfaceCopy.beatPar(rivalName)
    : hostFappySurfaceCopy.timeToBeat(formatRelayClockSeconds(chase.timeToBeatMs), rivalName);
};
