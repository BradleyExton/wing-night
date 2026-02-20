import { CLIENT_TO_SERVER_EVENTS } from "@wingnight/shared";
import type { MinigameType } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { requestAdjustTeamScore } from "../requestAdjustTeamScore";
import { requestAssignPlayer } from "../requestAssignPlayer";
import { requestCreateTeam } from "../requestCreateTeam";
import { requestExtendTimer } from "../requestExtendTimer";
import { requestMinigameAction } from "../requestMinigameAction";
import { requestNextPhase } from "../requestNextPhase";
import { requestPauseTimer } from "../requestPauseTimer";
import { requestRedoLastMutation } from "../requestRedoLastMutation";
import { requestReorderTurnOrder } from "../requestReorderTurnOrder";
import { requestResetGame } from "../requestResetGame";
import { requestResumeTimer } from "../requestResumeTimer";
import { requestSetWingParticipation } from "../requestSetWingParticipation";
import { requestSkipTurnBoundary } from "../requestSkipTurnBoundary";

type HostControlPanelSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export type HostControlPanelHandlers = {
  onNextPhase: () => void;
  onCreateTeam: (name: string) => void;
  onAssignPlayer: (playerId: string, teamId: string | null) => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onDispatchMinigameAction: (
    minigameId: MinigameType,
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onExtendTimer: (additionalSeconds: number) => void;
  onReorderTurnOrder: (teamIds: string[]) => void;
  onSkipTurnBoundary: () => void;
  onAdjustTeamScore: (teamId: string, delta: number) => void;
  onResetGame: () => void;
  onRedoLastMutation: () => void;
};

type HostControlPanelRequestDependencies = {
  requestNextPhase: typeof requestNextPhase;
  requestCreateTeam: typeof requestCreateTeam;
  requestAssignPlayer: typeof requestAssignPlayer;
  requestSetWingParticipation: typeof requestSetWingParticipation;
  requestMinigameAction: typeof requestMinigameAction;
  requestPauseTimer: typeof requestPauseTimer;
  requestResumeTimer: typeof requestResumeTimer;
  requestExtendTimer: typeof requestExtendTimer;
  requestReorderTurnOrder: typeof requestReorderTurnOrder;
  requestSkipTurnBoundary: typeof requestSkipTurnBoundary;
  requestAdjustTeamScore: typeof requestAdjustTeamScore;
  requestResetGame: typeof requestResetGame;
  requestRedoLastMutation: typeof requestRedoLastMutation;
};

const defaultDependencies: HostControlPanelRequestDependencies = {
  requestNextPhase,
  requestCreateTeam,
  requestAssignPlayer,
  requestSetWingParticipation,
  requestMinigameAction,
  requestPauseTimer,
  requestResumeTimer,
  requestExtendTimer,
  requestReorderTurnOrder,
  requestSkipTurnBoundary,
  requestAdjustTeamScore,
  requestResetGame,
  requestRedoLastMutation
};

export const createHostControlPanelHandlers = (
  socket: HostControlPanelSocket,
  dependencies: HostControlPanelRequestDependencies = defaultDependencies
): HostControlPanelHandlers => {
  const claimControl = (): void => {
    socket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
  };

  return {
    onNextPhase: (): void => {
      dependencies.requestNextPhase(socket, claimControl);
    },
    onCreateTeam: (name: string): void => {
      dependencies.requestCreateTeam(socket, name, claimControl);
    },
    onAssignPlayer: (playerId: string, teamId: string | null): void => {
      dependencies.requestAssignPlayer(socket, playerId, teamId, claimControl);
    },
    onSetWingParticipation: (playerId: string, didEat: boolean): void => {
      dependencies.requestSetWingParticipation(socket, playerId, didEat, claimControl);
    },
    onDispatchMinigameAction: (
      minigameId: MinigameType,
      actionType: string,
      actionPayload: SerializableValue
    ): void => {
      dependencies.requestMinigameAction(
        socket,
        minigameId,
        actionType,
        actionPayload,
        claimControl
      );
    },
    onPauseTimer: (): void => {
      dependencies.requestPauseTimer(socket, claimControl);
    },
    onResumeTimer: (): void => {
      dependencies.requestResumeTimer(socket, claimControl);
    },
    onExtendTimer: (additionalSeconds: number): void => {
      dependencies.requestExtendTimer(socket, additionalSeconds, claimControl);
    },
    onReorderTurnOrder: (teamIds: string[]): void => {
      dependencies.requestReorderTurnOrder(socket, teamIds, claimControl);
    },
    onSkipTurnBoundary: (): void => {
      dependencies.requestSkipTurnBoundary(socket, claimControl);
    },
    onAdjustTeamScore: (teamId: string, delta: number): void => {
      dependencies.requestAdjustTeamScore(socket, teamId, delta, claimControl);
    },
    onResetGame: (): void => {
      dependencies.requestResetGame(socket, claimControl);
    },
    onRedoLastMutation: (): void => {
      dependencies.requestRedoLastMutation(socket, claimControl);
    }
  };
};
