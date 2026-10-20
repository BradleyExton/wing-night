import { useMemo } from "react";
import type { Outfit, BrawlPlayerFigure } from "@wingnight/shared";

import { resolveHenFigure, type HenFigure } from "../resolveHenFigure/index.js";

type UseHenFigureInput = {
  figure: BrawlPlayerFigure | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
};

/**
 * `resolveHenFigure`, held stable across renders. The view arrives as a fresh deep copy on every
 * server echo — every walk and every peck — and the scene repaints its rest pose whenever the hen
 * it was handed changes identity, so resolved per render every tap would snap the street back to
 * the start line. Memoised on the figure's own fields, the hen only changes when the player does
 * (useRunnerFigure's lesson).
 */
export const useHenFigure = ({ figure, activeTurnTeamId, serverOrigin }: UseHenFigureInput): HenFigure => {
  const playerId = figure?.playerId ?? null;
  const name = figure?.name ?? null;
  const avatarSrc = figure?.avatarSrc ?? null;
  const teamId = figure?.teamId ?? null;
  const genre = figure?.genre ?? null;
  // The outfit is an object, fresh on every echo: the memo keys on what is worn, not on which copy.
  const outfitKey = JSON.stringify(figure?.outfit ?? null);

  return useMemo(() => {
    return resolveHenFigure({
      figure: playerId === null || name === null ? null : { playerId, name, avatarSrc, teamId, genre, outfit: JSON.parse(outfitKey) as Outfit | null },
      activeTurnTeamId,
      serverOrigin
    });
  }, [playerId, name, avatarSrc, teamId, genre, outfitKey, activeTurnTeamId, serverOrigin]);
};
