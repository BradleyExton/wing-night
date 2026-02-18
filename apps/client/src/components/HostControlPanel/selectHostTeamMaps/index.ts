import type { RoomState } from "@wingnight/shared";

type HostTeamMaps = {
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
};

export const selectHostTeamMaps = (roomState: RoomState | null): HostTeamMaps => {
  const assignedTeamByPlayerId = new Map<string, string>();
  const teamNameByTeamId = new Map<string, string>();

  if (!roomState) {
    return { assignedTeamByPlayerId, teamNameByTeamId };
  }

  for (const team of roomState.teams) {
    teamNameByTeamId.set(team.id, team.name);

    for (const playerId of team.playerIds) {
      assignedTeamByPlayerId.set(playerId, team.id);
    }
  }

  return { assignedTeamByPlayerId, teamNameByTeamId };
};
