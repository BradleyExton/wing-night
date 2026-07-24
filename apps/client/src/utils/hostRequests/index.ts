import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  TIMER_EXTEND_MAX_SECONDS,
  type GameReorderTurnOrderPayload,
  type HostSecretPayload,
  type MinigameActionPayload,
  type MinigameType,
  type ScoringAdjustTeamScorePayload,
  type ScoringSetWingParticipationPayload,
  type SetupAddPlayerPayload,
  type SetupAssignPlayerPayload,
  type SetupCreateTeamPayload,
  type TimerExtendPayload
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";

export type HostRequestSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

type PayloadEventName = {
  [EventName in keyof OutboundSocketEvents]: Parameters<
    OutboundSocketEvents[EventName]
  > extends [unknown]
    ? EventName
    : never;
}[keyof OutboundSocketEvents];

type EventPayload<EventName extends PayloadEventName> = Parameters<
  OutboundSocketEvents[EventName]
>[0];

type HostRequestArgs = {
  onNextPhase: [];
  onCreateTeam: [name: string];
  onAddPlayer: [name: string];
  onAssignPlayer: [playerId: string, teamId: string | null];
  onAutoAssignRemainingPlayers: [];
  onSetWingParticipation: [playerId: string, didEat: boolean];
  onDispatchMinigameAction: [
    minigameId: MinigameType,
    actionType: string,
    actionPayload: SerializableValue
  ];
  onPauseTimer: [];
  onResumeTimer: [];
  onExtendTimer: [additionalSeconds: number];
  onReorderTurnOrder: [teamIds: string[]];
  onSkipTurnBoundary: [];
  onAdjustTeamScore: [teamId: string, delta: number];
  onResetGame: [];
  onRedoLastMutation: [];
};

export type HostRequestName = keyof HostRequestArgs;

export type HostRequestHandlers = {
  [Name in HostRequestName]: (...args: HostRequestArgs[Name]) => void;
};

type HostRequestSpec<TArgs extends unknown[]> = {
  [EventName in PayloadEventName]: {
    event: EventName;
    canEmit?: (...args: TArgs) => boolean;
    buildPayload: (hostSecret: string, ...args: TArgs) => EventPayload<EventName>;
  };
}[PayloadEventName];

type HostRequestTable = {
  [Name in HostRequestName]: HostRequestSpec<HostRequestArgs[Name]>;
};

const buildHostSecretPayload = (hostSecret: string): HostSecretPayload => ({
  hostSecret
});

const isValidTeamIdList = (teamIds: string[]): boolean => {
  if (teamIds.length === 0) {
    return false;
  }

  const seenTeamIds = new Set<string>();

  for (const teamId of teamIds) {
    if (teamId.trim().length === 0 || seenTeamIds.has(teamId)) {
      return false;
    }

    seenTeamIds.add(teamId);
  }

  return true;
};

export const hostRequestTable: HostRequestTable = {
  onNextPhase: {
    event: CLIENT_TO_SERVER_EVENTS.NEXT_PHASE,
    buildPayload: buildHostSecretPayload
  },
  onCreateTeam: {
    event: CLIENT_TO_SERVER_EVENTS.CREATE_TEAM,
    canEmit: (name): boolean => name.trim().length > 0,
    buildPayload: (hostSecret, name): SetupCreateTeamPayload => ({
      hostSecret,
      name: name.trim()
    })
  },
  onAddPlayer: {
    event: CLIENT_TO_SERVER_EVENTS.ADD_PLAYER,
    canEmit: (name): boolean => name.trim().length > 0,
    buildPayload: (hostSecret, name): SetupAddPlayerPayload => ({
      hostSecret,
      name: name.trim()
    })
  },
  onAssignPlayer: {
    event: CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER,
    buildPayload: (hostSecret, playerId, teamId): SetupAssignPlayerPayload => ({
      hostSecret,
      playerId,
      teamId
    })
  },
  onAutoAssignRemainingPlayers: {
    event: CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS,
    buildPayload: buildHostSecretPayload
  },
  onSetWingParticipation: {
    event: CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION,
    buildPayload: (
      hostSecret,
      playerId,
      didEat
    ): ScoringSetWingParticipationPayload => ({
      hostSecret,
      playerId,
      didEat
    })
  },
  onDispatchMinigameAction: {
    event: CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION,
    buildPayload: (
      hostSecret,
      minigameId,
      actionType,
      actionPayload
    ): MinigameActionPayload => ({
      hostSecret,
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId,
      actionType,
      actionPayload
    })
  },
  onPauseTimer: {
    event: CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE,
    buildPayload: buildHostSecretPayload
  },
  onResumeTimer: {
    event: CLIENT_TO_SERVER_EVENTS.TIMER_RESUME,
    buildPayload: buildHostSecretPayload
  },
  onExtendTimer: {
    event: CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND,
    canEmit: (additionalSeconds): boolean =>
      Number.isInteger(additionalSeconds) &&
      additionalSeconds > 0 &&
      additionalSeconds <= TIMER_EXTEND_MAX_SECONDS,
    buildPayload: (hostSecret, additionalSeconds): TimerExtendPayload => ({
      hostSecret,
      additionalSeconds
    })
  },
  onReorderTurnOrder: {
    event: CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER,
    canEmit: (teamIds): boolean => isValidTeamIdList(teamIds),
    buildPayload: (hostSecret, teamIds): GameReorderTurnOrderPayload => ({
      hostSecret,
      teamIds: [...teamIds]
    })
  },
  onSkipTurnBoundary: {
    event: CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY,
    buildPayload: buildHostSecretPayload
  },
  onAdjustTeamScore: {
    event: CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE,
    canEmit: (teamId, delta): boolean =>
      Number.isInteger(delta) && delta !== 0 && teamId.trim().length > 0,
    buildPayload: (hostSecret, teamId, delta): ScoringAdjustTeamScorePayload => ({
      hostSecret,
      teamId,
      delta
    })
  },
  onResetGame: {
    event: CLIENT_TO_SERVER_EVENTS.RESET,
    buildPayload: buildHostSecretPayload
  },
  onRedoLastMutation: {
    event: CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION,
    buildPayload: buildHostSecretPayload
  }
};

type CreateHostRequestHandlersOptions = {
  getHostSecret?: () => string | null;
};

export const createHostRequestHandlers = (
  socket: HostRequestSocket,
  options: CreateHostRequestHandlersOptions = {}
): HostRequestHandlers => {
  const getHostSecret = options.getHostSecret ?? readHostSecret;

  const buildHandler = <Name extends HostRequestName>(
    name: Name
  ): ((...args: HostRequestArgs[Name]) => void) => {
    const spec: HostRequestSpec<HostRequestArgs[Name]> = hostRequestTable[name];

    return (...args: HostRequestArgs[Name]): void => {
      const hostSecret = getHostSecret();

      if (!hostSecret) {
        socket.emit(CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL);
        return;
      }

      if (spec.canEmit && !spec.canEmit(...args)) {
        return;
      }

      const emitEvent = socket.emit as (
        event: PayloadEventName,
        payload: EventPayload<PayloadEventName>
      ) => void;

      // Preserve socket method context for socket.io-client internals.
      emitEvent.call(socket, spec.event, spec.buildPayload(hostSecret, ...args));
    };
  };

  return {
    onNextPhase: buildHandler("onNextPhase"),
    onCreateTeam: buildHandler("onCreateTeam"),
    onAddPlayer: buildHandler("onAddPlayer"),
    onAssignPlayer: buildHandler("onAssignPlayer"),
    onAutoAssignRemainingPlayers: buildHandler("onAutoAssignRemainingPlayers"),
    onSetWingParticipation: buildHandler("onSetWingParticipation"),
    onDispatchMinigameAction: buildHandler("onDispatchMinigameAction"),
    onPauseTimer: buildHandler("onPauseTimer"),
    onResumeTimer: buildHandler("onResumeTimer"),
    onExtendTimer: buildHandler("onExtendTimer"),
    onReorderTurnOrder: buildHandler("onReorderTurnOrder"),
    onSkipTurnBoundary: buildHandler("onSkipTurnBoundary"),
    onAdjustTeamScore: buildHandler("onAdjustTeamScore"),
    onResetGame: buildHandler("onResetGame"),
    onRedoLastMutation: buildHandler("onRedoLastMutation")
  };
};
