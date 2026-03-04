import { Phase, type RoomState } from "@wingnight/shared";

import { logPhaseTransition } from "../../logger/index.js";
import { getRoomStateSnapshot } from "../baseMutations/index.js";
import {
  applyPhaseTransitionEffects,
  resolveCanAdvancePhase,
  resolveNextPhase
} from "../phaseState/index.js";
import {
  clearScoringMutationUndoState
} from "../scoringState/index.js";
import {
  isRoomInFatalState,
  resolveCurrentRoundConfig
} from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";
import { finalizeActiveRoundTurn } from "../turnState/index.js";

export const skipTurnBoundary = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const previousPhase = roomState.phase;
  const canSkipTurn =
    previousPhase === Phase.EATING ||
    previousPhase === Phase.MINIGAME_INTRO ||
    previousPhase === Phase.MINIGAME_PLAY;

  if (!canSkipTurn) {
    return getRoomStateSnapshot();
  }

  const hasNextRoundTurn =
    roomState.roundTurnCursor + 1 < roomState.turnOrderTeamIds.length;
  finalizeActiveRoundTurn(roomState);

  const nextPhase = hasNextRoundTurn ? Phase.MINIGAME_INTRO : Phase.ROUND_RESULTS;
  roomState.phase = nextPhase;
  roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);

  // Score application is intentionally broad for skip boundaries:
  // skipping from EATING/MINIGAME_INTRO/MINIGAME_PLAY still finalizes round points.
  applyPhaseTransitionEffects(roomState, previousPhase, nextPhase, {
    applyRoundResultScoresFromAnyTurnBoundary: true
  });

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};

export const advanceRoomStatePhase = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const previousPhase = roomState.phase;
  const previousRound = roomState.currentRound;

  if (!resolveCanAdvancePhase(roomState)) {
    return getRoomStateSnapshot();
  }

  const nextPhase = resolveNextPhase(roomState, previousPhase);

  if (previousPhase === Phase.TURN_RESULTS) {
    finalizeActiveRoundTurn(roomState);
  }

  roomState.phase = nextPhase;

  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.ROUND_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  if (previousPhase === Phase.ROUND_RESULTS && nextPhase === Phase.ROUND_INTRO) {
    roomState.currentRound += 1;
  }

  if (nextPhase === Phase.FINAL_RESULTS) {
    roomState.currentRoundConfig = null;
  } else {
    roomState.currentRoundConfig = resolveCurrentRoundConfig(roomState);
  }
  applyPhaseTransitionEffects(roomState, previousPhase, nextPhase);

  if (roomState.currentRound !== previousRound) {
    clearScoringMutationUndoState(roomState);
  }

  logPhaseTransition(previousPhase, nextPhase, roomState.currentRound);

  return getRoomStateSnapshot();
};
