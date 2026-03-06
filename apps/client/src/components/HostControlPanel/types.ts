import type { SerializableValue } from "@wingnight/minigames-core";
import type { RoomState } from "@wingnight/shared";

export type HostControlPanelProps = {
  roomState: RoomState | null;
  onNextPhase?: () => void;
  onCreateTeam?: (name: string) => void;
  onAddPlayer?: (name: string) => void;
  onAssignPlayer?: (playerId: string, teamId: string | null) => void;
  onAutoAssignRemainingPlayers?: () => void;
  onSetWingParticipation?: (playerId: string, didEat: boolean) => void;
  onDispatchMinigameAction?: (
    minigameId: NonNullable<RoomState["currentRoundConfig"]>["minigame"],
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
  onReorderTurnOrder?: (teamIds: string[]) => void;
  onSkipTurnBoundary?: () => void;
  onAdjustTeamScore?: (teamId: string, delta: number) => void;
  onResetGame?: () => void;
  onRedoLastMutation?: () => void;
};
