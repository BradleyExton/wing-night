import type { Player, Team } from "@wingnight/shared";

export type TeamRosterPreview = {
  visiblePlayerNames: string[];
  hiddenPlayerCount: number;
};

export const resolveTeamRosterPreview = (
  team: Team,
  playerById: Map<string, Player>,
  maxVisiblePlayers: number
): TeamRosterPreview => {
  const normalizedMaxVisiblePlayers = Math.max(maxVisiblePlayers, 0);
  const assignedPlayerNames = team.playerIds
    .map((playerId) => playerById.get(playerId)?.name ?? null)
    .filter((playerName): playerName is string => playerName !== null);
  const visiblePlayerNames = assignedPlayerNames.slice(0, normalizedMaxVisiblePlayers);
  const hiddenPlayerCount = Math.max(
    assignedPlayerNames.length - visiblePlayerNames.length,
    0
  );

  return {
    visiblePlayerNames,
    hiddenPlayerCount
  };
};
