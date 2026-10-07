import { Phase, type MinigamePlayerView, type PlayerRoomStateSnapshot } from "@wingnight/shared";

import { resolveTurnTeamId } from "../resolvePhoneTurn";

type PhoneAnswerRoom = Pick<PlayerRoomStateSnapshot, "phase" | "teams" | "activeRoundTeamId" | "activeTurnTeamId">;

// The answer card this phone shows, or null when it shows none. The card is the server's (only this
// phone is ever sent it); the phone only checks the room agrees it is still this player's team's
// turn being played, so a card that outlived its turn by a frame never paints over the next screen.
export const resolvePhoneAnswer = (
  room: PhoneAnswerRoom,
  playerId: string,
  card: MinigamePlayerView | null
): MinigamePlayerView | null => {
  if (card === null || room.phase !== Phase.MINIGAME_PLAY) {
    return null;
  }

  const team = room.teams.find((candidate) => candidate.playerIds.includes(playerId)) ?? null;

  return team !== null && team.id === resolveTurnTeamId(room) ? card : null;
};
