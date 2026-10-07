import { isDeepStrictEqual } from "node:util";

import { PLAYER_CLAIM_GONE_REASONS, type RoomState } from "@wingnight/shared";

import { refreshActiveMinigameProjection } from "../../minigames/runtime/index.js";
import { playerClaimStore } from "../../playerClaims/index.js";
import { syncContestantTurn } from "../contestantTurnState/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { resolveMinigameRules } from "../selectors/index.js";

// The claim store is the truth about which phone is which player; the room
// carries only the ids it is safe to publish. This copies one into the other
// and says whether anything moved, so a no-op never broadcasts.
export const writePlayerClaimFlags = (roomState: RoomState): boolean => {
  const { claimedPlayerIds, connectedPlayerIds } = playerClaimStore.resolveFlags(roomState.players);

  if (
    isDeepStrictEqual(roomState.claimedPlayerIds, claimedPlayerIds) &&
    isDeepStrictEqual(roomState.connectedPlayerIds, connectedPlayerIds)
  ) {
    return false;
  }

  roomState.claimedPlayerIds = claimedPlayerIds;
  roomState.connectedPlayerIds = connectedPlayerIds;
  // A phone waking, sleeping or losing its face moves who writes the leg in hand.
  syncContestantTurn(roomState);

  // And a face claimed or let go on the playing team moves every "n of m in" (phone answers).
  const minigameId = roomState.currentRoundConfig?.minigame ?? null;

  if (minigameId !== null) {
    refreshActiveMinigameProjection(roomState, resolveMinigameRules(roomState, minigameId));
  }

  return true;
};

// Every site that rewrites `players` calls this straight after: a content
// reload and Quick Play keep only the claims whose id is still on the roster
// and still names the same person (ids are positional), and the phones that
// lost theirs are told why.
export const prunePlayerClaimsForRoster = (roomState: RoomState): void => {
  playerClaimStore.prune(roomState.players);
  writePlayerClaimFlags(roomState);
};

// Reset Game, and anything else that throws the night away: no claim survives
// and the join token is rotated, so a phone has to scan the TV again rather
// than walk back into a night it was never part of.
export const clearPlayerClaimsForReset = (roomState: RoomState): void => {
  playerClaimStore.clear(PLAYER_CLAIM_GONE_REASONS.NIGHT_RESET);
  playerClaimStore.rotateJoinToken();
  writePlayerClaimFlags(roomState);
};

// The socket layer changes the store (a claim, a release, a phone waking or
// sleeping) and then runs this, so the room hears it in one broadcast.
export const syncPlayerClaimFlags = defineRoomMutation({
  run: (roomState): boolean => writePlayerClaimFlags(roomState)
});

// The host freeing a face from the tablet, in any phase.
export const releasePlayerClaimByHost = defineRoomMutation({
  run: (roomState, playerId: string): boolean => {
    if (!playerClaimStore.release(playerId, PLAYER_CLAIM_GONE_REASONS.RELEASED_BY_HOST)) {
      return false;
    }

    writePlayerClaimFlags(roomState);

    return true;
  }
});

// The host's "new join code": a code that leaked off the TV (a photo in a group
// chat) stops seating new phones, and every phone already holding a face keeps
// it — it reconnects on its claim secret, not the code. Room state does not
// change, so nothing broadcasts; the TV is handed the new code directly.
export const rotatePlayerJoinTokenByHost = defineRoomMutation({
  run: (): boolean => {
    playerClaimStore.rotateJoinToken();

    return false;
  }
});
