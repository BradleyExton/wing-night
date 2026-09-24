import { useMemo } from "react";
import type { SchlonicPlayerFigure } from "@wingnight/shared";

import { resolveRunnerFigure, type RunnerFigure } from "../resolveRunnerFigure/index.js";

type UseRunnerFigureInput = {
  figure: SchlonicPlayerFigure | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
};

/**
 * `resolveRunnerFigure`, held stable across renders. The view arrives as a fresh deep copy on
 * every server echo — every press and release — and the scene repaints its rest pose whenever
 * the runner it was handed changes identity. Resolved per render, that meant every tap snapped
 * the zone back to the start line for a frame and put every collected wing back on the shore;
 * memoised on the figure's own fields, the runner only changes when the player does.
 */
export const useRunnerFigure = ({
  figure,
  activeTurnTeamId,
  serverOrigin
}: UseRunnerFigureInput): RunnerFigure => {
  const playerId = figure?.playerId ?? null;
  const name = figure?.name ?? null;
  const avatarSrc = figure?.avatarSrc ?? null;
  const teamId = figure?.teamId ?? null;
  const genre = figure?.genre ?? null;

  return useMemo(() => {
    return resolveRunnerFigure({
      figure:
        playerId === null || name === null
          ? null
          : { playerId, name, avatarSrc, teamId, genre },
      activeTurnTeamId,
      serverOrigin
    });
  }, [playerId, name, avatarSrc, teamId, genre, activeTurnTeamId, serverOrigin]);
};
