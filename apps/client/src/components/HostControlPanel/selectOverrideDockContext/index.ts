import { Phase, type RoomState } from "@wingnight/shared";

type OverrideDockContext = {
  isVisible: boolean;
  isTurnOrderEditable: boolean;
  showPreviousPhaseAction: boolean;
  showSkipTurnBoundaryAction: boolean;
  showRedoLastMutationAction: boolean;
  showResetGameAction: boolean;
  showBadge: boolean;
};

const OVERRIDE_DOCK_PHASES = new Set<Phase>([
  Phase.ROUND_INTRO,
  Phase.EATING,
  Phase.MINIGAME_INTRO,
  Phase.MINIGAME_PLAY,
  Phase.ROUND_RESULTS,
  Phase.FINAL_RESULTS
]);

const SKIP_TURN_PHASES = new Set<Phase>([
  Phase.EATING,
  Phase.MINIGAME_INTRO,
  Phase.MINIGAME_PLAY
]);

const areTeamIdOrdersEqual = (leftTeamIds: string[], rightTeamIds: string[]): boolean => {
  if (leftTeamIds.length !== rightTeamIds.length) {
    return false;
  }

  return leftTeamIds.every((teamId, index) => teamId === rightTeamIds[index]);
};

export const hasCustomTurnOrder = (roomState: RoomState | null): boolean => {
  if (!roomState) {
    return false;
  }

  const defaultTeamIds = roomState.teams.map((team) => team.id);
  return !areTeamIdOrdersEqual(roomState.turnOrderTeamIds, defaultTeamIds);
};

export const selectOverrideDockContext = (roomState: RoomState | null): OverrideDockContext => {
  const phase = roomState?.phase ?? null;
  const isVisible = phase !== null && OVERRIDE_DOCK_PHASES.has(phase);
  const showPreviousPhaseAction =
    isVisible && roomState?.canRevertPhaseTransition === true;
  const showRedoLastMutationAction = isVisible && roomState?.canRedoScoringMutation === true;

  return {
    isVisible,
    isTurnOrderEditable: phase === Phase.ROUND_INTRO,
    showPreviousPhaseAction,
    showSkipTurnBoundaryAction: phase !== null && SKIP_TURN_PHASES.has(phase),
    showRedoLastMutationAction,
    showResetGameAction: isVisible,
    showBadge:
      showPreviousPhaseAction ||
      showRedoLastMutationAction ||
      hasCustomTurnOrder(roomState)
  };
};
