import { GAME_START_COUNTDOWN_MS, Phase } from "@wingnight/shared";
import type { RoomState } from "@wingnight/shared";

import { logPhaseTransition } from "../../logger/index.js";
import { defineRoomMutation } from "../defineRoomMutation/index.js";
import {
  applyPhaseTransitionEffects,
  resolveCanAdvancePhase,
  resolveNextPhase
} from "../phaseState/index.js";
import {
  clearScoringMutationUndoState
} from "../scoringState/index.js";
import { resolveCurrentRoundConfig } from "../selectors/index.js";
import { finalizeActiveRoundTurn } from "../turnState/index.js";

export const skipTurnBoundary = defineRoomMutation({
  requiredPhase: [Phase.EATING, Phase.MINIGAME_INTRO, Phase.MINIGAME_PLAY],
  run: (roomState): boolean => {
    const previousPhase = roomState.phase;
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

    return true;
  }
});

const runPhaseAdvance = (roomState: RoomState): boolean => {
  const previousPhase = roomState.phase;
  const previousRound = roomState.currentRound;

  if (!resolveCanAdvancePhase(roomState)) {
    return false;
  }

  const nextPhase = resolveNextPhase(roomState, previousPhase);

  if (previousPhase === Phase.TURN_RESULTS) {
    finalizeActiveRoundTurn(roomState);
  }

  roomState.phase = nextPhase;

  // The round counter moves on the way INTO the round's first team briefing —
  // the beat the deleted round intro screen used to own.
  if (
    previousPhase === Phase.INTRO &&
    nextPhase === Phase.MINIGAME_INTRO &&
    roomState.currentRound === 0
  ) {
    roomState.currentRound = 1;
  }

  if (previousPhase === Phase.ROUND_RESULTS && nextPhase === Phase.MINIGAME_INTRO) {
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

  return true;
};

export const advanceRoomStatePhase = defineRoomMutation({
  run: runPhaseAdvance
});

// Start Game is one button with two beats, and the host taps the SAME event
// for both: the first arms the count-in and leaves the room on the lock
// screen, the second — sent by the host when the clock runs out — is what
// actually starts the night. Splitting it this way is what makes a duplicate
// harmless: a second tablet's tap during the count-in is a no-op, and a tap
// after the advance fails the INTRO precondition.
export const startGame = defineRoomMutation({
  requiredPhase: Phase.INTRO,
  run: (roomState): boolean => {
    const countdownEndsAt = roomState.gameStartCountdownEndsAt;

    if (countdownEndsAt === null) {
      if (!resolveCanAdvancePhase(roomState)) {
        return false;
      }

      roomState.gameStartCountdownEndsAt = Date.now() + GAME_START_COUNTDOWN_MS;

      return true;
    }

    if (Date.now() < countdownEndsAt) {
      return false;
    }

    return runPhaseAdvance(roomState);
  }
});
