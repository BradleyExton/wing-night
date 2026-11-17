import { isDeepStrictEqual } from "node:util";

import type { MinigameCrew } from "@wingnight/minigames-core";
import {
  MINIGAME_DEVICE_MODES,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  Phase,
  isCrewMinigameType,
  resolveRoundDeviceMode,
  type CrewTurn,
  type MinigameType,
  type PlayerMinigameActionRefusalReason,
  type RoomState
} from "@wingnight/shared";

import { selectActiveMinigameCrew, supportsCrewTurns } from "../../minigames/runtime/index.js";
import { TURN_PHASES } from "../contestantTurnState/index.js";
import { resolveMinigameRules } from "../selectors/index.js";

// Whose phones are pads in a crew game, and what each pad shows (`RoomState.crewTurn`).
//
// One part of it is a fact the room has to remember: the device mode the turn was LOCKED to when
// its briefing opened, exactly as a relay's is. The rest is the game's own `selectCrew`, copied
// out after every room mutation that moved anything (`defineRoomMutation`), so no client ever
// works out who may play or how many hearts anybody has. It reads no claim flag: a crew is who
// stepped out, which the game knows from its own inputs.

const createLockedTurn = (state: RoomState): CrewTurn | null => {
  const minigame = state.currentRoundConfig?.minigame ?? null;

  if (minigame === null || !isCrewMinigameType(minigame) || !supportsCrewTurns(minigame)) {
    return null;
  }

  return {
    minigame,
    deviceMode: resolveRoundDeviceMode(state.roundDeviceModes, state.currentRound),
    status: null,
    playerIds: [],
    pads: {}
  };
};

/**
 * The turn as the game's crew now has it. No stage in hand, or a turn locked to the tablet, has
 * no pads at all: in tablet mode the game plays its tablet shape and every phone watches the TV.
 */
export const deriveCrewTurn = (turn: CrewTurn, crew: MinigameCrew | null): CrewTurn => {
  if (crew === null) {
    return { ...turn, status: null, playerIds: [], pads: {} };
  }

  if (turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES) {
    return { ...turn, status: crew.status, playerIds: [], pads: {} };
  }

  return { ...turn, status: crew.status, playerIds: crew.playerIds, pads: crew.pads };
};

// Re-derives the crew and its pads; says whether anything moved.
export const syncCrewTurn = (state: RoomState): boolean => {
  const turn = state.crewTurn;

  if (turn === null) {
    return false;
  }

  const crew =
    state.phase === Phase.MINIGAME_PLAY ? selectActiveMinigameCrew(resolveMinigameRules(state, turn.minigame)) : null;
  const nextTurn = deriveCrewTurn(turn, crew !== null && crew.minigameId === turn.minigame ? crew.result : null);

  if (isDeepStrictEqual(turn, nextTurn)) {
    return false;
  }

  state.crewTurn = nextTurn;

  return true;
};

// Runs inside every phase transition, beside the relays' own: a briefing opening locks the
// round's device mode into the turn, and leaving the turn's phases lets the lock go.
export const applyCrewTurnPhaseEffects = (state: RoomState, nextPhase: Phase): void => {
  if (nextPhase === Phase.MINIGAME_INTRO) {
    state.crewTurn = createLockedTurn(state);
  } else if (!TURN_PHASES.includes(nextPhase)) {
    state.crewTurn = null;
  }

  syncCrewTurn(state);
};

/**
 * Why a phone may not send this action in a crew game right now, or null when it may: a turn
 * locked to phones, an action the game lets a phone send, and a face on the team whose turn it
 * is. That is all — there is no leg to hold and no single writer, because every player on the
 * crew plays at once and the game tells them apart by the face the server stamps on the action.
 */
export const resolveCrewActionRefusal = (
  turn: CrewTurn | null,
  minigameId: MinigameType,
  playerId: string,
  isPhoneAction: boolean
): PlayerMinigameActionRefusalReason | null => {
  if (turn === null || turn.minigame !== minigameId || turn.deviceMode !== MINIGAME_DEVICE_MODES.PHONES) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE;
  }

  if (!isPhoneAction) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION;
  }

  if (!turn.playerIds.includes(playerId)) {
    return PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_IN_CREW;
  }

  return null;
};
