import { Phase, type RoomState } from "@wingnight/shared";

import {
  clearActiveMinigameRuntimeState,
  initializeActiveMinigameRuntimeState
} from "../../minigames/runtime/index.js";
import { getNextPhase } from "../../utils/getNextPhase/index.js";
import {
  createRunningTimer,
  isRoomInFatalState,
  isSetupReadyToStart,
  resolveMinigamePointsMax,
  resolveMinigameRules,
  resolveMinigameTimerSeconds
} from "../selectors/index.js";
import {
  applyPendingRoundScoresToTotals,
  clearPendingRoundScores,
  clearScoringMutationUndoState,
  resetRoundWingParticipation
} from "../scoringState/index.js";
import { initializeRoundTurnState } from "../turnState/index.js";

export type ApplyPhaseTransitionEffectsOptions = {
  applyRoundResultScoresFromAnyTurnBoundary?: boolean;
};

const initializeActiveMinigameTurnState = (state: RoomState): void => {
  const minigameType = state.currentRoundConfig?.minigame ?? null;

  if (minigameType === null) {
    clearActiveMinigameRuntimeState(state);
    return;
  }

  const minigamePointsMax = resolveMinigamePointsMax(state);

  if (minigamePointsMax === null) {
    clearActiveMinigameRuntimeState(state);
    return;
  }

  initializeActiveMinigameRuntimeState(
    state,
    minigamePointsMax,
    resolveMinigameRules(state, minigameType)
  );
};

const setTimerForPhase = (state: RoomState, nextPhase: Phase): void => {
  if (nextPhase === Phase.EATING) {
    const eatingSeconds = state.gameConfig?.timers.eatingSeconds ?? null;
    state.timer =
      eatingSeconds === null ? null : createRunningTimer(Phase.EATING, eatingSeconds);
    return;
  }

  if (nextPhase === Phase.MINIGAME_PLAY) {
    const minigameSeconds = resolveMinigameTimerSeconds(state);
    state.timer =
      minigameSeconds === null
        ? null
        : createRunningTimer(Phase.MINIGAME_PLAY, minigameSeconds);
    return;
  }

  state.timer = null;
};

export const applyPhaseTransitionEffects = (
  state: RoomState,
  previousPhase: Phase,
  nextPhase: Phase,
  options: ApplyPhaseTransitionEffectsOptions = {}
): void => {
  if (nextPhase === Phase.ROUND_INTRO) {
    initializeRoundTurnState(state);
  }

  if (previousPhase === Phase.EATING && nextPhase === Phase.MINIGAME_PLAY) {
    initializeActiveMinigameTurnState(state);
  }

  if (previousPhase === Phase.MINIGAME_PLAY && nextPhase !== Phase.MINIGAME_PLAY) {
    clearActiveMinigameRuntimeState(state);
  }

  const shouldApplyRoundResultScores =
    nextPhase === Phase.ROUND_RESULTS &&
    (options.applyRoundResultScoresFromAnyTurnBoundary === true ||
      previousPhase === Phase.TURN_RESULTS);

  if (shouldApplyRoundResultScores) {
    clearScoringMutationUndoState(state);
    applyPendingRoundScoresToTotals(state);
  }

  if (previousPhase === Phase.ROUND_RESULTS) {
    clearPendingRoundScores(state);
  }

  if (previousPhase === Phase.ROUND_INTRO && nextPhase === Phase.MINIGAME_INTRO) {
    resetRoundWingParticipation(state);
  }

  setTimerForPhase(state, nextPhase);
};

export const resolveNextPhase = (state: RoomState, previousPhase: Phase): Phase => {
  if (previousPhase === Phase.MINIGAME_PLAY) {
    return Phase.TURN_RESULTS;
  }

  if (previousPhase === Phase.TURN_RESULTS) {
    const hasNextRoundTurn =
      state.roundTurnCursor + 1 < state.turnOrderTeamIds.length;

    return hasNextRoundTurn ? Phase.MINIGAME_INTRO : Phase.ROUND_RESULTS;
  }

  return getNextPhase(previousPhase, state.currentRound, state.totalRounds);
};

export const resolveCanAdvancePhase = (state: RoomState): boolean => {
  if (isRoomInFatalState(state)) {
    return false;
  }

  if (state.phase === Phase.FINAL_RESULTS) {
    return false;
  }

  if (state.phase === Phase.SETUP) {
    return isSetupReadyToStart(state);
  }

  if (state.phase === Phase.MINIGAME_INTRO) {
    return state.activeRoundTeamId !== null;
  }

  if (state.phase === Phase.EATING) {
    if (state.activeRoundTeamId === null) {
      return false;
    }

    const activeTeam = state.teams.find((team) => team.id === state.activeRoundTeamId);

    if (!activeTeam || activeTeam.playerIds.length === 0) {
      return false;
    }

    return activeTeam.playerIds.every((playerId) => {
      return Object.hasOwn(state.wingParticipationByPlayerId, playerId);
    });
  }

  return true;
};
