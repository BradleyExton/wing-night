import { resolveRoomTurnOrderTeamIds } from "@wingnight/shared";
import type { RoomState, Team } from "@wingnight/shared";

// The teams in the order they play (or will play) this round. The snapshot's
// `turnOrderTeamIds` is the host-edited base; each round opens one team
// further down it, so the list the host sees is the rotated one.
export const resolveOrderedTeams = (
  roomState: RoomState | null
): Team[] => {
  if (!roomState) {
    return [];
  }

  const teamById = new Map(roomState.teams.map((team) => [team.id, team] as const));
  const orderedTeams = resolveRoomTurnOrderTeamIds(roomState)
    .map((teamId) => teamById.get(teamId))
    .filter((team): team is Team => team !== undefined);

  if (orderedTeams.length === roomState.teams.length) {
    return orderedTeams;
  }

  return roomState.teams;
};
