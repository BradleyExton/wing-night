import type { RoomState, Team } from "@wingnight/shared";

export const resolveOrderedTeams = (
  roomState: RoomState | null
): Team[] => {
  if (!roomState) {
    return [];
  }

  const teamById = new Map(roomState.teams.map((team) => [team.id, team] as const));
  const orderedTeams = roomState.turnOrderTeamIds
    .map((teamId) => teamById.get(teamId))
    .filter((team): team is Team => team !== undefined);

  if (orderedTeams.length === roomState.teams.length) {
    return orderedTeams;
  }

  return roomState.teams;
};
