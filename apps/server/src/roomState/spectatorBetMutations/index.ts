import type { SpectatorBetPick, SpectatorBetRefusalReason } from "@wingnight/shared";

import { defineRoomMutation } from "../defineRoomMutation/index.js";
import {
  dropSpectatorBet,
  resolveSpectatorBetRefusal,
  writeSpectatorBet
} from "../spectatorBetState/index.js";
import { getRoomState } from "../stateStore/index.js";

// Why the phone holding this face may not bet now, or null — read before the mutation so the ack
// can say why, the way `readContestantActionRefusal` does for a contestant's input.
export const readSpectatorBetRefusal = (playerId: string): SpectatorBetRefusalReason | null => {
  return resolveSpectatorBetRefusal(getRoomState(), playerId);
};

// A watcher's OVER or UNDER. The one thing a phone off the playing team can change, and it reaches
// nothing but the turn's bets: no phase, no turn cursor, no score.
export const placeSpectatorBet = defineRoomMutation({
  run: (roomState, playerId: string, pick: SpectatorBetPick): boolean => {
    return writeSpectatorBet(roomState, playerId, pick);
  }
});

// A face's claim ended while the window is open: its holder's pick goes with them, so whoever
// sits in the face next starts with no bet (`playerClaimStore.onClaimEnded`).
export const releaseSpectatorBet = defineRoomMutation({
  run: (roomState, playerId: string): boolean => dropSpectatorBet(roomState, playerId)
});

// The pick this player holds on the turn in hand, for their own room alone.
export const readOwnSpectatorBet = (playerId: string): { turnKey: string; pick: SpectatorBetPick | null } | null => {
  const bets = getRoomState().spectatorBets;

  if (bets === null) {
    return null;
  }

  return { turnKey: bets.turnKey, pick: bets.betsByPlayerId[playerId] ?? null };
};
