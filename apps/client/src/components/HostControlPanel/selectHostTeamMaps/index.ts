import type { RoomState, TeamTheme } from "@wingnight/shared";

import { resolveTeamThemeById } from "../../../utils/resolveTeamTheme";

type HostTeamMaps = {
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  // The host's one copy of every team's kit (docs/team-identity.md); surfaces
  // read it rather than resolving a theme of their own.
  teamThemeByTeamId: Map<string, TeamTheme>;
};

export const selectHostTeamMaps = (roomState: RoomState | null): HostTeamMaps => {
  const assignedTeamByPlayerId = new Map<string, string>();
  const teamNameByTeamId = new Map<string, string>();

  if (!roomState) {
    return { assignedTeamByPlayerId, teamNameByTeamId, teamThemeByTeamId: new Map() };
  }

  for (const team of roomState.teams) {
    teamNameByTeamId.set(team.id, team.name);

    for (const playerId of team.playerIds) {
      assignedTeamByPlayerId.set(playerId, team.id);
    }
  }

  return {
    assignedTeamByPlayerId,
    teamNameByTeamId,
    teamThemeByTeamId: resolveTeamThemeById(roomState.teams)
  };
};
