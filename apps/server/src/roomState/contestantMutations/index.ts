import {
  CONTESTANT_CONTROLLERS,
  MINIGAME_DEVICE_MODES,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  isContestantMinigameType,
  resolveRoundDeviceMode,
  type MinigameDeviceMode,
  type MinigameType,
  type PlayerMinigameActionRefusalReason,
  type RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  dispatchActiveMinigameRuntimeAction,
  isContestantMinigameAction,
  resolveContestantRetakeActionType,
  selectActiveMinigameDeadline,
  supportsContestantTurns
} from "../../minigames/runtime/index.js";
import { holdContestantLegOnTablet } from "../contestantTurnState/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import { applyMinigameAction } from "../scoringMutations/index.js";
import { isMinigamePlayState, resolveMinigameContext, resolveMinigameRules } from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

// The host's per-round device setting. Any phase — the round cards in SETUP, or the deck
// mid-night — but only for a round whose game can be played on phones. It is read when a turn's
// briefing opens (`applyContestantTurnPhaseEffects`), so it never changes a turn under way.
export const setRoundDeviceMode = defineRoomMutation({
  run: (roomState, round: number, deviceMode: MinigameDeviceMode): boolean => {
    const minigame = roomState.gameConfig?.rounds[round - 1]?.minigame ?? null;

    if (
      !Number.isInteger(round) ||
      round < 1 ||
      minigame === null ||
      !isContestantMinigameType(minigame) ||
      !supportsContestantTurns(minigame)
    ) {
      return false;
    }

    if (resolveRoundDeviceMode(roomState.roundDeviceModes, round) === deviceMode) {
      return false;
    }

    roomState.roundDeviceModes = { ...roomState.roundDeviceModes, [round]: deviceMode };

    return true;
  }
});

// "Take it back": the leg in hand goes to the tablet for the rest of it, and the game restarts it
// clean (`contestantRetakeActionType`) because the tablet can never continue a log the phone
// wrote. A JOUST shot is atomic: the shot about to be aimed simply moves to the tablet.
//
// It is the host's hatch for a phone that dropped, died or is in the wrong hands, so it is allowed
// whenever the leg could have been a phone's — whether or not that phone is awake. It is not an
// undo point: undo takes back a score, and this is not one.
export const takeBackContestantLeg = defineRoomMutation({
  requiredPhase: Phase.MINIGAME_PLAY,
  run: (roomState): boolean => {
    const turn = roomState.contestantTurn;

    if (
      turn === null ||
      turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES ||
      turn.legIndex === null ||
      turn.contestantPlayerId === null ||
      !roomState.claimedPlayerIds.includes(turn.contestantPlayerId)
    ) {
      return false;
    }

    // Already the tablet's: nothing to take.
    if (!holdContestantLegOnTablet(roomState, turn.legIndex)) {
      return false;
    }

    const retakeActionType = resolveContestantRetakeActionType(turn.minigame);
    const minigameContext = resolveMinigameContext(roomState, turn.minigame);

    if (retakeActionType !== null && minigameContext !== null) {
      dispatchActiveMinigameRuntimeAction(
        roomState,
        { actionType: retakeActionType, actionPayload: {}, receivedAtMs: Date.now() },
        minigameContext.minigamePointsMax,
        minigameContext.minigameRules
      );
    }

    return true;
  }
});

// Why a contestant's phone may not send this action right now, or null when it may. The checks
// a PLAYER socket has to pass beyond holding a face (the socket layer checked that): the game in
// play, a turn locked to phones, an input the game lets a phone send, this player's own leg, and
// the phone — not the tablet — holding it. `controller` already folds in claimed and awake.
export const resolveContestantActionRefusal = (
  roomState: RoomState,
  playerId: string,
  minigameId: MinigameType,
  actionType: string
): PlayerMinigameActionRefusalReason | null => {
  if (!isMinigamePlayState(roomState, minigameId)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE;
  }

  const turn = roomState.contestantTurn;

  if (turn === null || turn.minigame !== minigameId || turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE;
  }

  if (!isContestantMinigameAction(minigameId, actionType)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION;
  }

  if (turn.contestantPlayerId === null || turn.contestantPlayerId !== playerId) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT;
  }

  if (turn.controller !== CONTESTANT_CONTROLLERS.PHONE) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_HOLDS_LEG;
  }

  return null;
};

// The same question against the live room, for the socket layer to answer the phone's ack before
// it dispatches. Single-threaded: nothing can move the room between this and the dispatch.
export const readContestantActionRefusal = (
  playerId: string,
  minigameId: MinigameType,
  actionType: string
): PlayerMinigameActionRefusalReason | null => {
  return resolveContestantActionRefusal(getRoomState(), playerId, minigameId, actionType);
};

// A contestant's phone playing its own leg (`player:minigameAction`). The refusal is asked again
// here, so the mutation is safe whoever calls it; past it, the action takes exactly the tablet's
// road into the game.
export const dispatchContestantMinigameAction = defineRoomMutation({
  run: (
    roomState,
    playerId: string,
    minigameId: MinigameType,
    actionType: string,
    actionPayload: SerializableValue
  ): boolean => {
    if (resolveContestantActionRefusal(roomState, playerId, minigameId, actionType) !== null) {
      return false;
    }

    return applyMinigameAction(roomState, minigameId, actionType, actionPayload, Date.now())
      .didProjectionChange;
  }
});

// The deadline the game in play wants the server to enforce (`selectDeadlineAction`), if any.
// Only during play: a deadline left over from a turn that has ended is no deadline.
export const readMinigameDeadline = (): {
  minigameId: MinigameType;
  actionType: string;
  atMs: number;
} | null => {
  const roomState = getRoomState();
  const minigameId = roomState.currentRoundConfig?.minigame ?? null;

  if (roomState.phase !== Phase.MINIGAME_PLAY || minigameId === null) {
    return null;
  }

  const deadline = selectActiveMinigameDeadline(resolveMinigameRules(roomState, minigameId));

  if (deadline === null || deadline.minigameId !== minigameId) {
    return null;
  }

  return { minigameId, actionType: deadline.result.actionType, atMs: deadline.result.atMs };
};

// The server's own clock reaching a game's deadline. Stamped with that clock's reading — the one
// every `receivedAtMs` comes from — and otherwise the tablet's road into the game, undo point
// included. No device sent it, so nobody's leg is held by it.
export const dispatchServerMinigameAction = defineRoomMutation({
  run: (roomState, minigameId: MinigameType, actionType: string, receivedAtMs: number): boolean => {
    return applyMinigameAction(roomState, minigameId, actionType, {}, receivedAtMs).didProjectionChange;
  }
});
