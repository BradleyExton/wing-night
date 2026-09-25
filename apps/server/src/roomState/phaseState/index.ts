import { Phase, SESSION_MODES, type RoomState } from "@wingnight/shared";

import {
  clearActiveMinigameRuntimeState,
  initializeActiveMinigameRuntimeState
} from "../../minigames/runtime/index.js";
import { getNextPhase } from "../../utils/getNextPhase/index.js";
import { setMusicForPhase } from "../musicState/index.js";
import {
  createRunningTimer,
  isRoomInFatalState,
  isSetupReadyToStart,
  resolveMinigameContext,
  resolveMinigameTimerSeconds
} from "../selectors/index.js";
import {
  applyPendingRoundScoresToTotals,
  clearPendingRoundScores,
  clearScoringMutationUndoState,
  resetRoundWingParticipation
} from "../scoringState/index.js";
import { initializeRoundTurnState } from "../turnState/index.js";

type ApplyPhaseTransitionEffectsOptions = {
  applyRoundResultScoresFromAnyTurnBoundary?: boolean;
};

const initializeActiveMinigameTurnState = (state: RoomState): void => {
  const minigameType = state.currentRoundConfig?.minigame ?? null;
  const minigameContext =
    minigameType === null ? null : resolveMinigameContext(state, minigameType);

  if (minigameContext === null) {
    clearActiveMinigameRuntimeState(state);
    return;
  }

  initializeActiveMinigameRuntimeState(
    state,
    minigameContext.minigamePointsMax,
    minigameContext.minigameRules
  );
};

// A round now begins the moment its first team is called up, because the round
// intro screen it used to begin on is gone. MINIGAME_INTRO is reached three
// ways: from INTRO (round 1), from ROUND_RESULTS (every round after), and from
// TURN_RESULTS (the next team in the round already running). Only the first two
// start a round; the third must leave the turn cursor exactly where it is.
const isRoundStartTransition = (previousPhase: Phase, nextPhase: Phase): boolean => {
  return (
    nextPhase === Phase.MINIGAME_INTRO &&
    (previousPhase === Phase.INTRO || previousPhase === Phase.ROUND_RESULTS)
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
  const isRoundStart = isRoundStartTransition(previousPhase, nextPhase);

  // The INTRO count-in exists only to hold this transition back; once it has
  // happened, whether it was counted in or advanced straight through, the
  // room is past it. Cleared here so no later phase can inherit a stale one.
  state.gameStartCountdownEndsAt = null;

  if (isRoundStart) {
    initializeRoundTurnState(state);
  }

  // Entering play from anywhere seats the turn: EATING on a night, the
  // briefing itself in Quick Play, where there is no EATING to come from.
  if (previousPhase !== Phase.MINIGAME_PLAY && nextPhase === Phase.MINIGAME_PLAY) {
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

  if (isRoundStart) {
    resetRoundWingParticipation(state);
  }

  setTimerForPhase(state, nextPhase);
  // After the turn state above, never before it: the anthem is the ACTIVE
  // team's, and `initializeRoundTurnState` is what decides who that is.
  setMusicForPhase(state, nextPhase);
};

export const resolveNextPhase = (state: RoomState, previousPhase: Phase): Phase => {
  if (previousPhase === Phase.MINIGAME_PLAY) {
    return Phase.TURN_RESULTS;
  }

  // Quick Play has no wings: the briefing goes straight to play.
  if (
    previousPhase === Phase.MINIGAME_INTRO &&
    state.sessionMode === SESSION_MODES.QUICK_PLAY
  ) {
    return Phase.MINIGAME_PLAY;
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

    // Untapped players are treated as "didn't eat" — scoring already requires
    // an explicit `=== true`, so absent is semantically equivalent to false.
    // Host can advance whenever they're done marking the eaters.
    return true;
  }

  return true;
};
