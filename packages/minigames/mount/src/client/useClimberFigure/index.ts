import { useMemo } from "react";
import type { MountPlayerFigure } from "@wingnight/shared";

import { resolveHenFigure, type HenFigure } from "../resolveHenFigure/index.js";

/**
 * `resolveHenFigure` for the climb's player, held stable across renders. The view arrives as a
 * fresh deep copy on every echo — every 70 ms batch of fingers — and the climber must only be
 * redrawn when the player changes (BRAWL's `useHenFigure` lesson).
 */
export const useClimberFigure = (
  figure: MountPlayerFigure | null,
  activeTurnTeamId: string | null,
  serverOrigin: string | null
): HenFigure => {
  const playerId = figure?.playerId ?? null;
  const name = figure?.name ?? null;
  const avatarSrc = figure?.avatarSrc ?? null;
  const teamId = figure?.teamId ?? null;
  const genre = figure?.genre ?? null;

  return useMemo(() => {
    return resolveHenFigure(
      playerId === null || name === null ? null : { playerId, name, avatarSrc, teamId, genre },
      activeTurnTeamId,
      serverOrigin
    );
  }, [playerId, name, avatarSrc, teamId, genre, activeTurnTeamId, serverOrigin]);
};
