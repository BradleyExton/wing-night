import { useMemo } from "react";
import type { SchlonicPlayerFigure } from "@wingnight/shared";

import type { SchlonicLeg } from "../SchlonicScene/SetPieces/index.js";
import { useRunnerFigure } from "../useRunnerFigure/index.js";

type LegView = {
  activeTurnTeamId: string | null;
  runsPerTurn: number;
  runs: readonly { player: SchlonicPlayerFigure | null }[];
};

/**
 * The leg a surface is showing, with the relay either side of it: the rider who brought the
 * team here and the one it goes to next, as figures the scene stands on the sidewalk. Both
 * surfaces read it off the same view, so the tablet and the wall wait the same teammate at the
 * same post. Figures are memoised by `useRunnerFigure`, so the scene only changes when a player
 * does.
 */
export const useSchlonicLeg = ({
  view,
  runIndex,
  serverOrigin
}: {
  view: LegView;
  runIndex: number;
  serverOrigin: string | null;
}): SchlonicLeg => {
  const lastRun = runIndex > 0 ? (view.runs[runIndex - 1] ?? null) : null;
  const nextRun = view.runs[runIndex + 1] ?? null;
  const last = useRunnerFigure({
    figure: lastRun?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const next = useRunnerFigure({
    figure: nextRun?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const hasLast = lastRun !== null;
  const hasNext = nextRun !== null;

  return useMemo(() => {
    return {
      index: runIndex,
      count: view.runsPerTurn,
      last: hasLast ? last : null,
      next: hasNext ? next : null
    };
  }, [runIndex, view.runsPerTurn, hasLast, last, hasNext, next]);
};
