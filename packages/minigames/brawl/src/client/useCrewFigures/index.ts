import { useMemo } from "react";
import type { BrawlCrewMember, BrawlPlayerFigure } from "@wingnight/shared";

import { resolveHenFigure, type HenFigure } from "../resolveHenFigure/index.js";

/**
 * Each hen of a block as the cast draws her, by slot, held stable across renders. The view
 * arrives as a fresh deep copy with every thumb, and a hen whose figure changed identity would
 * be redrawn — so this is keyed on what the crew IS, never on which copy of it arrived. `count`
 * is how many hens are on the street: a slot with nobody behind it is the house hen.
 */
export const useCrewFigures = (
  crew: readonly BrawlCrewMember[],
  count: number,
  activeTurnTeamId: string | null,
  serverOrigin: string | null
): HenFigure[] => {
  const players = JSON.stringify(Array.from({ length: count }, (_unused, slot) => crew.find((member) => member.slot === slot)?.player ?? null));

  return useMemo(() => {
    return (JSON.parse(players) as (BrawlPlayerFigure | null)[]).map((figure) => resolveHenFigure({ figure, activeTurnTeamId, serverOrigin }));
  }, [players, activeTurnTeamId, serverOrigin]);
};
