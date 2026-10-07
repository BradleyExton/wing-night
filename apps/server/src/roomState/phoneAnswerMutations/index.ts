import {
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  type MinigamePlayerView,
  type MinigameType,
  type PlayerMinigameActionRefusalReason,
  type RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { logError } from "../../logger/index.js";
import { playerClaimStore } from "../../playerClaims/index.js";
import {
  dispatchActivePlayerAnswer,
  isPlayerAnswerMinigameAction,
  releaseActivePlayerAnswer,
  resolveAnsweringPlayers,
  selectActiveMinigamePlayerView
} from "../../minigames/runtime/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import {
  isMinigamePlayState,
  resolveMinigameContext,
  resolveMinigameRules,
  resolveTeamIdByPlayerId
} from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

// Answers on the phones (AGENTS.md §3.4): during the playing team's turn every seated phone on
// that team answers the question in hand at once — a GEO pin, a TRIVIA choice — and the host still
// locks and reveals on the tablet. This is the phone's half: who may answer, and the answer landing.

// Why this phone may not send this answer now, or null when it may: the game in play, an action
// the game lets a phone answer with, a face this socket holds that is seated, on the team whose
// turn it is. Whether the question is still open is the game's to say (its reducer refuses).
export const resolvePlayerAnswerRefusal = (
  roomState: RoomState,
  playerId: string,
  minigameId: MinigameType,
  actionType: string
): PlayerMinigameActionRefusalReason | null => {
  if (!isMinigamePlayState(roomState, minigameId)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE;
  }

  if (!isPlayerAnswerMinigameAction(minigameId, actionType)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION;
  }

  if (!roomState.claimedPlayerIds.includes(playerId)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_SEATED;
  }

  const teamId = resolveTeamIdByPlayerId(roomState, playerId);

  if (teamId === null || teamId !== roomState.activeRoundTeamId) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_ON_TURN;
  }

  return null;
};

// The same question against the live room, for the socket layer to answer the phone's ack.
export const readPlayerAnswerRefusal = (
  playerId: string,
  minigameId: MinigameType,
  actionType: string
): PlayerMinigameActionRefusalReason | null => {
  return resolvePlayerAnswerRefusal(getRoomState(), playerId, minigameId, actionType);
};

// Which claim of a face gave the answer it holds (`PlayerClaim.serial`), stamped only when an
// answer actually changed the game. An answer is its holder's, not the face's: it is replayed only
// to that claim (`isAnswerHolder`), and an answer whose claim has since ended is dropped wherever
// it comes back — a claim ending drops an open one, and so does an undo that reopens a question
// (`releaseDepartedAnswers`), so the next guest in the face never inherits it.
const answerClaimSerialByPlayerId = new Map<string, number>();

// Whether the phone holding this face now is the one that gave the answer it holds.
export const isAnswerHolder = (playerId: string): boolean => {
  const serial = answerClaimSerialByPlayerId.get(playerId);

  return serial !== undefined && serial === playerClaimStore.resolveClaimSerial(playerId);
};

// After the host's undo puts the game back as it stood before a lock, the question is open again —
// with every answer that was in at the time, including those of guests whose claims have since
// ended. Each such answer leaves with its holder, exactly as it would have had the question been
// open when they went. Returns whether any answer was dropped.
export const releaseDepartedAnswers = (roomState: RoomState): boolean => {
  const minigameId = roomState.currentRoundConfig?.minigame ?? null;

  if (minigameId === null) {
    return false;
  }

  let didRelease = false;

  for (const [playerId, serial] of answerClaimSerialByPlayerId) {
    if (playerClaimStore.resolveClaimSerial(playerId) === serial) {
      continue;
    }

    answerClaimSerialByPlayerId.delete(playerId);
    didRelease =
      releaseActivePlayerAnswer(roomState, playerId, resolveMinigameRules(roomState, minigameId)) || didRelease;
  }

  return didRelease;
};

// Whether a phone's action is an answer (the game's player action types) rather than a contestant's
// input, so the socket layer knows which road it takes.
export const isPlayerAnswerAction = (minigameId: MinigameType, actionType: string): boolean => {
  return isPlayerAnswerMinigameAction(minigameId, actionType);
};

// A playing-team phone's answer. The refusal is asked again here, so the mutation is safe whoever
// calls it. It takes the tablet's stamp (`receivedAtMs`) but NEVER its undo point: an answer is the
// turn being played, like a DRAWING stroke, and the host's lock is the undoable act. It reaches the
// game's state and nothing else — the lock is what scores.
export const dispatchPlayerAnswerAction = defineRoomMutation({
  requiredPhase: Phase.MINIGAME_PLAY,
  run: (
    roomState,
    playerId: string,
    minigameId: MinigameType,
    actionType: string,
    actionPayload: SerializableValue
  ): boolean => {
    if (resolvePlayerAnswerRefusal(roomState, playerId, minigameId, actionType) !== null) {
      return false;
    }

    const minigameContext = resolveMinigameContext(roomState, minigameId);

    if (minigameContext === null) {
      return false;
    }

    try {
      const didAnswer = dispatchActivePlayerAnswer(
        roomState,
        playerId,
        { actionType, actionPayload, receivedAtMs: Date.now() },
        minigameContext.minigamePointsMax,
        minigameContext.minigameRules
      );
      const serial = playerClaimStore.resolveClaimSerial(playerId);

      // Only an answer the game took makes this claim the holder of the face's answer: a refused
      // late pin from a new guest must not unlock the last holder's locked one for them.
      if (didAnswer && serial !== null) {
        answerClaimSerialByPlayerId.set(playerId, serial);
      }

      return didAnswer;
    } catch (error) {
      // A phone's answer never takes the turn down with it: the host's tablet still has the game.
      logError("server:minigamePlayerAnswerFailure", error);
      return false;
    }
  }
});

// A face's claim ended while a question was open: its holder's answer goes with them
// (`playerClaimStore.onClaimEnded`), so whoever sits in the face next starts blank.
export const releasePlayerAnswer = defineRoomMutation({
  requiredPhase: Phase.MINIGAME_PLAY,
  run: (roomState, playerId: string): boolean => {
    const minigameId = roomState.currentRoundConfig?.minigame ?? null;

    if (minigameId === null) {
      return false;
    }

    return releaseActivePlayerAnswer(roomState, playerId, resolveMinigameRules(roomState, minigameId));
  }
});

// The playing team's seated phones, while a turn is being played: whose rooms get an answer card.
export const readAnsweringPlayerIds = (): string[] => {
  const roomState = getRoomState();

  if (roomState.phase !== Phase.MINIGAME_PLAY) {
    return [];
  }

  return resolveAnsweringPlayers(roomState).map((player) => player.id);
};

// One phone's own answer card, for its own room alone — only while a turn is being played.
export const readMinigamePlayerView = (playerId: string, showOwnAnswer: boolean): MinigamePlayerView | null => {
  const roomState = getRoomState();
  const minigameId = roomState.currentRoundConfig?.minigame ?? null;

  if (roomState.phase !== Phase.MINIGAME_PLAY || minigameId === null) {
    return null;
  }

  return selectActiveMinigamePlayerView(
    roomState,
    playerId,
    showOwnAnswer,
    resolveMinigameRules(roomState, minigameId)
  );
};
