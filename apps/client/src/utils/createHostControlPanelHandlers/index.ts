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

type HostControlPanelHandlers = {
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

  const invokeWithoutArgs = (
    request: (
      socket: HostControlPanelSocket,
      onMissingHostSecret?: () => void
    ) => boolean
  ): (() => void) => {
    return (): void => {
      request(socket, claimControl);
    };
  };

  const invokeWithOneArg = <TArg>(
    request: (
      socket: HostControlPanelSocket,
      arg: TArg,
      onMissingHostSecret?: () => void
    ) => boolean
  ): ((arg: TArg) => void) => {
    return (arg: TArg): void => {
      request(socket, arg, claimControl);
    };
  };

  const invokeWithTwoArgs = <TFirstArg, TSecondArg>(
    request: (
      socket: HostControlPanelSocket,
      firstArg: TFirstArg,
      secondArg: TSecondArg,
      onMissingHostSecret?: () => void
    ) => boolean
  ): ((firstArg: TFirstArg, secondArg: TSecondArg) => void) => {
    return (firstArg: TFirstArg, secondArg: TSecondArg): void => {
      request(socket, firstArg, secondArg, claimControl);
    };
  };

  const invokeWithThreeArgs = <TFirstArg, TSecondArg, TThirdArg>(
    request: (
      socket: HostControlPanelSocket,
      firstArg: TFirstArg,
      secondArg: TSecondArg,
      thirdArg: TThirdArg,
      onMissingHostSecret?: () => void
    ) => boolean
  ): ((firstArg: TFirstArg, secondArg: TSecondArg, thirdArg: TThirdArg) => void) => {
    return (firstArg: TFirstArg, secondArg: TSecondArg, thirdArg: TThirdArg): void => {
      request(socket, firstArg, secondArg, thirdArg, claimControl);
    };
  };

  return {
    onNextPhase: invokeWithoutArgs(dependencies.requestNextPhase),
    onCreateTeam: invokeWithOneArg(dependencies.requestCreateTeam),
    onAssignPlayer: invokeWithTwoArgs(dependencies.requestAssignPlayer),
    onSetWingParticipation: invokeWithTwoArgs(dependencies.requestSetWingParticipation),
    onDispatchMinigameAction: invokeWithThreeArgs(dependencies.requestMinigameAction),
    onPauseTimer: invokeWithoutArgs(dependencies.requestPauseTimer),
    onResumeTimer: invokeWithoutArgs(dependencies.requestResumeTimer),
    onExtendTimer: invokeWithOneArg(dependencies.requestExtendTimer),
    onReorderTurnOrder: invokeWithOneArg(dependencies.requestReorderTurnOrder),
    onSkipTurnBoundary: invokeWithoutArgs(dependencies.requestSkipTurnBoundary),
    onAdjustTeamScore: invokeWithTwoArgs(dependencies.requestAdjustTeamScore),
    onResetGame: invokeWithoutArgs(dependencies.requestResetGame),
    onRedoLastMutation: invokeWithoutArgs(dependencies.requestRedoLastMutation)
  };
};
