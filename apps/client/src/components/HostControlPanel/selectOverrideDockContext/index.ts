import { Phase, type RoomState } from "@wingnight/shared";

type OverrideDockContext = {
  isVisible: boolean;
  isTurnOrderEditable: boolean;
  showSkipTurnBoundaryAction: boolean;
  showRedoLastMutationAction: boolean;
  showResetGameAction: boolean;
  showBadge: boolean;
};

// INTRO earns a dock of its own now that the round intro screen is gone: it is
// where the turn order for round one gets set.
const OVERRIDE_DOCK_PHASES = new Set<Phase>([
  Phase.INTRO,
  Phase.EATING,
  Phase.MINIGAME_INTRO,
  Phase.MINIGAME_PLAY,
  Phase.TURN_RESULTS,
  Phase.ROUND_RESULTS,
  Phase.FINAL_RESULTS
]);

// The order can only be rewritten while no round is in progress: before the
// game starts, and between rounds. The server enforces the same two phases.
const TURN_ORDER_EDITABLE_PHASES = new Set<Phase>([Phase.INTRO, Phase.ROUND_RESULTS]);

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
  const showRedoLastMutationAction = isVisible && roomState?.canRedoScoringMutation === true;

  return {
    isVisible,
    isTurnOrderEditable: phase !== null && TURN_ORDER_EDITABLE_PHASES.has(phase),
    showSkipTurnBoundaryAction: phase !== null && SKIP_TURN_PHASES.has(phase),
    showRedoLastMutationAction,
    showResetGameAction: isVisible,
    showBadge: showRedoLastMutationAction || hasCustomTurnOrder(roomState)
  };
};
