import {
  SPECTATOR_BET_STATUSES,
  type PlayerRoomStateSnapshot,
  type SpectatorBetOutcome,
  type SpectatorBetPick
} from "@wingnight/shared";

import type { OwnSpectatorBet } from "../../../utils/spectatorBetSlip";

// What this phone's bet card shows for the turn in hand, or null when it shows none: no bets up,
// the bets were voided by a skip, or this player is on the team about to play (that phone keeps
// its own turn's card). The window's status is the server's; the phone only reads it.
export type PhoneBet =
  // The window is open: the line and the two buttons, this phone's pick lit.
  | { stage: "open"; teamId: string; line: number; pick: SpectatorBetPick | null }
  // Play has started: the pick is locked (or there is none) and the phone points at the TV.
  | { stage: "locked"; teamId: string; line: number; pick: SpectatorBetPick | null }
  // The turn's results: the picks are public now, so the phone reads its own from the snapshot.
  | {
      stage: "settled";
      teamId: string;
      line: number;
      pick: SpectatorBetPick;
      turnPoints: number;
      outcome: SpectatorBetOutcome;
    };

type PhoneBetRoom = Pick<PlayerRoomStateSnapshot, "teams" | "spectatorBets">;

export const resolvePhoneBet = (
  room: PhoneBetRoom,
  playerId: string,
  ownBet: OwnSpectatorBet | null
): PhoneBet | null => {
  const bets = room.spectatorBets;
  const team = room.teams.find((candidate) => candidate.playerIds.includes(playerId)) ?? null;

  if (bets === null || team?.id === bets.teamId || bets.status === SPECTATOR_BET_STATUSES.VOID) {
    return null;
  }

  if (bets.status === SPECTATOR_BET_STATUSES.SETTLED) {
    const pick = bets.betsByPlayerId[playerId];

    // A watcher who sat this one out has nothing to settle: their phone goes back to idle.
    if (pick === undefined || bets.turnPoints === null || bets.outcome === null) {
      return null;
    }

    return { stage: "settled", teamId: bets.teamId, line: bets.line, pick, turnPoints: bets.turnPoints, outcome: bets.outcome };
  }

  const pick = ownBet !== null && ownBet.turnKey === bets.turnKey ? ownBet.pick : null;

  return {
    stage: bets.status === SPECTATOR_BET_STATUSES.OPEN ? "open" : "locked",
    teamId: bets.teamId,
    line: bets.line,
    pick
  };
};
